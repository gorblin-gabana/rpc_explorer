import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { db } from '../db/config';
import * as schema from '../db/schema';
import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../config';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

class DBService {
  private conn: Connection;

  constructor() {
    const RPC_ENDPOINT = config.HTTPS_RPC;
    const WS_ENDPOINT = config.WS_ENDPOINT;
    this.conn = new Connection(RPC_ENDPOINT, {
      commitment: 'confirmed',
      wsEndpoint: WS_ENDPOINT,
      disableRetryOnRateLimit: false,
    });
  }

  // Helper to convert string to PublicKey
  private toPubkey(str: string): PublicKey {
    return new PublicKey(str);
  }

  // Get account with caching
  async getAccount(address: string) {
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    const cached = await db.query.accounts.findFirst({
      where: (accounts, { eq, and, gte }) => 
        and(
          eq(accounts.address, address),
          gte(accounts.lastUpdated, sql`${cacheExpiry}`)
        )
    });

    if (cached) {
      return cached.data;
    }

    // If not in cache or expired, fetch from RPC
    const accountInfo = await this.conn.getAccountInfo(this.toPubkey(address));
    if (!accountInfo) return null;

    const accountData = {
      ...accountInfo,
      data: [...accountInfo.data], // Convert Uint8Array to array for JSON serialization
    };

    // Update cache
    const now = new Date();
    await db
      .insert(schema.accounts)
      .values({
        address,
        data: accountData,
        lastUpdated: now,
      })
      .onConflictDoUpdate({
        target: schema.accounts.address,
        set: {
          data: accountData,
          lastUpdated: now,
        },
      });

    return accountData;
  }

  // Get transaction with caching
  async getTransaction(signature: string) {
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    const cached = await db.query.transactions.findFirst({
      where: (txs, { eq, and, gte }) =>
        and(
          eq(txs.signature, signature),
          gte(txs.lastUpdated, sql`${cacheExpiry}`)
        )
    });

    if (cached) {
      return cached.data;
    }

    // If not in cache or expired, fetch from RPC
    const tx = await this.conn.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return null;

    // Update cache
    const now = new Date();
    const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : null;
    await db
      .insert(schema.transactions)
      .values({
        signature,
        data: tx,
        slot: tx.slot.toString(),
        blockTime,
        lastUpdated: now,
      })
      .onConflictDoUpdate({
        target: schema.transactions.signature,
        set: {
          data: tx,
          slot: tx.slot.toString(),
          blockTime,
          lastUpdated: now,
        },
      });

    return tx;
  }

  // Get token info with caching
  async getTokenInfo(mintAddress: string) {
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    const cached = await db.query.tokens.findFirst({
      where: (tokens, { eq, and, gte }) =>
        and(
          eq(tokens.mintAddress, mintAddress),
          gte(tokens.lastUpdated, sql`${cacheExpiry}`)
        )
    });

    if (cached) {
      return {
        supply: cached.supply,
        decimals: cached.decimals,
        metadata: cached.metadata,
      };
    }

    // If not in cache or expired, fetch from RPC
    const accountInfo = await this.conn.getAccountInfo(this.toPubkey(mintAddress));
    if (!accountInfo) return null;

    // Parse token info from account data
    const supply = accountInfo.data.readBigUInt64LE(36).toString();
    const decimals = accountInfo.data.readUInt8(44);

    // Update cache
    const now = new Date();
    const decimalsStr = decimals.toString();
    await db
      .insert(schema.tokens)
      .values({
        mintAddress,
        supply,
        decimals: decimalsStr,
        lastUpdated: now,
      })
      .onConflictDoUpdate({
        target: schema.tokens.mintAddress,
        set: {
          supply,
          decimals: decimalsStr,
          lastUpdated: now,
        },
      });

    return { supply, decimals };
  }

  // Get token holders with caching
  async getTokenHolders(mintAddress: string, limit = 100) {
    const cached = await db.query.tokenHolders.findMany({
      where: (holders, { eq }) => eq(holders.mintAddress, mintAddress),
      limit,
      orderBy: (holders) => [desc(holders.amount)],
    });

    if (cached.length > 0) {
      return cached.map(h => ({
        owner: h.ownerAddress,
        amount: h.amount,
      }));
    }

    // If not in cache, fetch from RPC
    // First get the token accounts for the mint
    const tokenAccounts = await this.conn.getParsedTokenAccountsByOwner(
      this.toPubkey(mintAddress),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
      'confirmed'
    );

    // Get all token accounts for the mint
    const allTokenAccounts = await this.conn.getTokenLargestAccounts(
      this.toPubkey(mintAddress),
      'confirmed'
    );

    const holders = allTokenAccounts.value.map(({ address, amount }) => ({
      owner: address.toString(),
      amount: amount.toString()
    }));

    // Update cache if we have holders
    if (holders.length > 0) {
      await db.transaction(async (tx) => {
        // Clear old holders for this mint
        await tx
          .delete(schema.tokenHolders)
          .where(eq(schema.tokenHolders.mintAddress, mintAddress));

        // Insert new holders
        const values = holders.map((h) => ({
          id: `${mintAddress}:${h.owner}`,
          mintAddress,
          ownerAddress: h.owner,
          amount: h.amount,
        }));

        if (values.length > 0) {
          await tx.insert(schema.tokenHolders).values(values);
        }
      });
    }

    return holders.slice(0, limit);
  }
}

export const dbService = new DBService();
