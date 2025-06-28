import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/config";
import { tokenHoldersCache, type TokenHolder } from "../db/schema";
import { eq, gte, sql, and, desc } from "drizzle-orm";
import { solana } from "../utils/solana";
import { PublicKey } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenHolderResponse:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           description: The token account address
 *         amount:
 *           type: string
 *           description: The token balance as a string
 *         decimals:
 *           type: number
 *           description: Number of decimals configured for the token
 *         owner:
 *           type: string
 *           description: The owner of the token account
 *         isFrozen:
 *           type: boolean
 *           description: Whether the token account is frozen
 *     TokenHoldersResponse:
 *       type: object
 *       properties:
 *         mint:
 *           type: string
 *           description: The mint address of the token
 *         holders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TokenHolderResponse'
 *         total:
 *           type: string
 *           description: Total supply of the token
 *         limit:
 *           type: number
 *           description: Maximum number of holders returned
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: When the data was last updated
 */

// Extend the Express Request type to include our custom properties
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

interface TokenHolderResponse {
  address: string;
  amount: string;
  decimals: number;
  owner: string;
  isFrozen: boolean;
}

interface TokenHoldersResponse {
  mint: string;
  holders: TokenHolderResponse[];
  total: string;
  lastUpdated: string;
  limit: number;
}

type CachedTokenHolders = {
  id: string;
  mintAddress: string;
  limit: number;
  holders: TokenHolder[];
  total: string;
  lastUpdated: Date;
  cacheKey: string;
};

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache TTL (less frequent updates)
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

export const tokenHoldersRouter = Router();

/**
 * @swagger
 * /api/tokens/{mint}/holders:
 *   get:
 *     summary: Get token holders for a specific mint
 *     description: Returns a list of token holders for the specified mint address
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: mint
 *         schema:
 *           type: string
 *         required: true
 *         description: The token mint address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of holders to return (max 1000)
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenHoldersResponse'
 *       400:
 *         description: Invalid mint address or limit parameter
 *       404:
 *         description: Token not found
 *       500:
 *         description: Server error
 */
tokenHoldersRouter.get<{ mint: string }, any, any, { limit?: string }>(
  "/:mint/holders",
  async (req, res, next): Promise<any> => {
    try {
      const { mint } = req.params;
      const limit =
        Math.min(
          parseInt(req.query.limit || `${DEFAULT_LIMIT}`, 10),
          MAX_LIMIT
        ) || DEFAULT_LIMIT;
      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

      // Try to get from cache first
      const cacheKey = `holders-${mint}-${limit}`;
      const cachedResult = (await db.query.tokenHoldersCache.findFirst({
        where: and(
          eq(sql`${tokenHoldersCache}::json->>'cacheKey'`, cacheKey),
          gte(tokenHoldersCache.lastUpdated, sql`${cacheExpiry}`)
        ),
        orderBy: [desc(tokenHoldersCache.lastUpdated)],
      })) as unknown as CachedTokenHolders | undefined;

      if (cachedResult?.holders) {
        const response: TokenHoldersResponse = {
          mint: cachedResult.mintAddress,
          holders: cachedResult.holders as unknown as TokenHolderResponse[],
          total: cachedResult.total,
          limit: cachedResult.limit,
          lastUpdated: cachedResult.lastUpdated.toISOString(),
        };
        return res.json(response);
      }

      // If not in cache or expired, fetch from RPC
      const tokenAccounts = await solana.connection.getTokenLargestAccounts(
        solana.toPubkey(mint),
        "confirmed"
      );

      const holders = await Promise.all(
        tokenAccounts.value.slice(0, Number(limit)).map(async (account) => {
          const accountInfo = await solana.connection.getParsedAccountInfo(
            account.address
          );

          if (!accountInfo.value) {
            return null;
          }

          const parsedInfo = (accountInfo.value.data as any).parsed.info;

          return {
            address: account.address.toBase58(),
            amount: parsedInfo.tokenAmount.uiAmountString,
            decimals: parsedInfo.tokenAmount.decimals,
            owner: parsedInfo.owner,
            isFrozen: parsedInfo.isFrozen,
          };
        })
      );

      // Filter out null values and ensure proper typing
      const validHolders = holders.filter(
        (h): h is NonNullable<typeof h> => h !== null
      );

      // Calculate total supply safely
      const totalSupply = tokenAccounts.value.reduce((sum, acc) => {
        return sum + (acc.uiAmount ? Number(acc.uiAmount) : 0);
      }, 0);

      // Prepare response
      const response: TokenHoldersResponse = {
        mint,
        holders: validHolders,
        total: totalSupply.toString(),
        limit: validHolders.length,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      try {
        const recordId = uuidv4();
        const now = new Date();
        const cacheKey = `holders-${mint}-${limit}`;

        // Prepare the record to insert with all required fields
        const record = {
          id: recordId,
          mintAddress: mint,
          ownerAddress: "", // Default empty owner
          amount: "0", // Default amount
          limit,
          holders: validHolders as unknown as TokenHolder[],
          total: totalSupply.toString(),
          lastUpdated: now,
          cacheKey,
        };

        // First, delete any existing entries with the same cache key
        await db
          .delete(tokenHoldersCache)
          .where(eq(sql`${tokenHoldersCache}::json->>'cacheKey'`, cacheKey));

        // Then insert the new record
        await db.insert(tokenHoldersCache).values(record);
      } catch (error) {
        console.error(`Error caching token holders for mint ${mint}:`, error);
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Export the router for use in the application
export default tokenHoldersRouter;
