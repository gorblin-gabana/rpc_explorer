import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solana } from '../utils/solana';
import { db } from '../db/config';
import { eq, and, gte, sql } from 'drizzle-orm';
import { tokens, tokenHolders } from '../db/schema';

const TOKEN_PROGRAM = new PublicKey(
  'J35jQQ3KKuMwTioVFLnjXdrFrUEc99eTwT2rWZ2EsxcN'
);
const MINT_SIZE = 82; // Change to 355 if using Token-2022
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export class TokenController {
  // Get token mints with caching
  public async getTokenMints(_req: Request, res: Response): Promise<void> {
    try {
      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
      
      // Try to get from cache first
      const cachedMints = await db.query.tokens.findMany({
        where: gte(tokens.lastUpdated, sql`${cacheExpiry}`),
        columns: { mintAddress: true }
      });

      if (cachedMints.length > 0) {
        res.json(cachedMints.map(t => t.mintAddress));
        return;
      }

      // If not in cache or expired, fetch from RPC
      const accts = await solana.connection.getProgramAccounts(TOKEN_PROGRAM, {
        dataSlice: { offset: 0, length: 0 }, // pubkeys only
        filters: [{ dataSize: MINT_SIZE }]
      });
      
      const mintAddresses = accts.map(a => a.pubkey.toBase58());
      
      // Update cache in background
      this.updateTokenCache(mintAddresses).catch(console.error);
      
      res.json(mintAddresses);
    } catch (e: any) {
      console.error('Error in getTokenMints:', e);
      res.status(500).json({ error: e.message });
    }
  }

  // Get token accounts with caching
  public async getTokenAccounts(req: Request, res: Response): Promise<void> {
    try {
      const owner = req.params.owner;
      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
      
      // Try to get from cache first
      const cachedHolders = await db.query.tokenHolders.findMany({
        where: and(
          eq(tokenHolders.ownerAddress, owner),
          gte(tokenHolders.lastUpdated, sql`${cacheExpiry}`)
        )
      });

      if (cachedHolders.length > 0) {
        res.json(cachedHolders.map(h => ({
          pubkey: h.id.split(':')[1],
          mint: h.mintAddress,
          owner: h.ownerAddress,
          amount: h.amount
        })));
        return;
      }

      // If not in cache or expired, fetch from RPC
      const ownerPubkey = solana.toPubkey(owner);
      const list = await solana.connection.getTokenAccountsByOwner(ownerPubkey, {
        programId: TOKEN_PROGRAM
      });
      
      const accounts = list.value.map(account => {
        const mint = account.account.data.slice(0, 32).toString('hex');
        const owner = account.account.data.slice(32, 64).toString('hex');
        const amount = account.account.data.readBigUInt64LE(64).toString();
        
        return {
          pubkey: account.pubkey.toBase58(),
          mint,
          owner,
          amount
        };
      });
      
      // Update cache in background
      this.updateTokenHoldersCache(owner, accounts).catch(console.error);
      
      res.json(accounts);
    } catch (e: any) {
      console.error('Error in getTokenAccounts:', e);
      res.status(500).json({ error: e.message });
    }
  }

  // Update token cache in database
  private async updateTokenCache(mintAddresses: string[]) {
    const now = new Date();
    
    for (const mintAddress of mintAddresses) {
      try {
        await db
          .insert(tokens)
          .values({
            mintAddress,
            lastUpdated: now,
          })
          .onConflictDoUpdate({
            target: tokens.mintAddress,
            set: { lastUpdated: now },
          });
      } catch (e) {
        console.error(`Error updating token cache for ${mintAddress}:`, e);
      }
    }
  }

  // Update token holders cache in database
  private async updateTokenHoldersCache(owner: string, accounts: Array<{pubkey: string, mint: string, amount: string}>) {
    const now = new Date();
    
    for (const account of accounts) {
      try {
        await db
          .insert(tokenHolders)
          .values({
            id: `${account.mint}:${owner}`,
            mintAddress: account.mint,
            ownerAddress: owner,
            amount: account.amount,
            lastUpdated: now,
          })
          .onConflictDoUpdate({
            target: tokenHolders.id,
            set: { 
              amount: account.amount,
              lastUpdated: now,
            },
          });
      } catch (e) {
        console.error(`Error updating token holder cache for ${account.mint}:${owner}:`, e);
      }
    }
  }
}
