import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/config";
import { accounts } from "../db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { solana } from "../utils/solana";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

/**
 * @swagger
 * /api/account/{pubkey}/info:
 *   get:
 *     summary: Get account information
 *     description: Returns account information for a given public key
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *         description: The account public key
 *     responses:
 *       200:
 *         description: Account information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 executable:
 *                   type: boolean
 *                 lamports:
 *                   type: number
 *                 owner:
 *                   type: string
 *                 rentEpoch:
 *                   type: string
 *                 data:
 *                   type: string
 *       404:
 *         description: Account not found
 */
// Get account info by public key
router.get(
  "/:pubkey/info",
  async (
    req: Request<{ pubkey: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { pubkey } = req.params;
      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

      // Try to get from cache first
      const cachedAccount = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.address, pubkey),
          gte(accounts.lastUpdated, sql`${cacheExpiry}`)
        ),
      });

      if (cachedAccount) {
        res.json(cachedAccount.data);
        return;
      }

      // If not in cache or expired, fetch from RPC
      const accountInfo = await solana.connection.getAccountInfo(
        solana.toPubkey(pubkey)
      );

      if (!accountInfo) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      const accountData = {
        ...accountInfo,
        owner: accountInfo.owner.toBase58(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch?.toString(),
        data: accountInfo.data.toString("base64"),
      };

      // Update cache in background
      db.insert(accounts)
        .values({
          address: pubkey,
          data: accountData,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: accounts.address,
          set: {
            data: accountData,
            lastUpdated: new Date(),
          },
        })
        .catch(console.error);

      res.json(accountData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/account/{pubkey}/transactions:
 *   get:
 *     summary: Get account transaction history
 *     description: Returns transaction signatures for an account with optional limit
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *         description: The account public key
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 1000
 *         description: Maximum number of signatures to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Start searching backwards from this transaction signature
 *     responses:
 *       200:
 *         description: Array of transaction signatures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   signature:
 *                     type: string
 *                   slot:
 *                     type: number
 *                   blockTime:
 *                     type: number
 *                     nullable: true
 *                   err:
 *                     type: object
 *                     nullable: true
 */
// Get account transaction history
router.get(
  "/:pubkey/transactions",
  async (
    req: Request<
      { pubkey: string },
      any,
      any,
      { limit?: string; before?: string; until?: string }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { pubkey } = req.params;
      const { limit = "10", before, until } = req.query;

      const parsedLimit = Math.min(parseInt(limit, 10) || 10, 1000);
      const options: any = {
        limit: parsedLimit,
        commitment: "confirmed",
      };

      if (before) {
        options.before = before;
      }

      if (until) {
        options.until = until;
      }

      const signatures = await solana.connection.getSignaturesForAddress(
        solana.toPubkey(pubkey),
        options
      );

      // Enhanced response with pagination metadata
      const response = {
        data: signatures,
        pagination: {
          limit: parsedLimit,
          hasMore: signatures.length === parsedLimit,
          before: before || null,
          until: until || null,
          nextCursor:
            signatures.length > 0
              ? signatures[signatures.length - 1].signature
              : null,
          prevCursor: signatures.length > 0 ? signatures[0].signature : null,
        },
        count: signatures.length,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/account/batch:
 *   post:
 *     summary: Get multiple account information
 *     description: Returns account information for multiple public keys
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pubkeys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of public keys to fetch
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: Array of account information objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pubkey:
 *                     type: string
 *                   account:
 *                     type: object
 *                     nullable: true
 */
// Get multiple accounts info
router.post(
  "/batch",
  async (
    req: Request<{}, any, { pubkeys: string[] }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { pubkeys } = req.body;

      if (!Array.isArray(pubkeys) || pubkeys.length === 0) {
        res.status(400).json({ error: "pubkeys array is required" });
        return;
      }

      if (pubkeys.length > 100) {
        res.status(400).json({ error: "Maximum 100 pubkeys allowed" });
        return;
      }

      const publicKeys = pubkeys.map((pubkey) => solana.toPubkey(pubkey));
      const accountInfos = await solana.connection.getMultipleAccountsInfo(
        publicKeys
      );

      const result = publicKeys.map((pubkey, index) => {
        const accountInfo = accountInfos[index];
        return {
          pubkey: pubkey.toBase58(),
          account: accountInfo
            ? {
                ...accountInfo,
                owner: accountInfo.owner.toBase58(),
                data: accountInfo.data.toString("base64"),
                rentEpoch: accountInfo.rentEpoch?.toString(),
              }
            : null,
        };
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
