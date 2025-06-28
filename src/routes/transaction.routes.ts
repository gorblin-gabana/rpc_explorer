import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/config";
import { transactions } from "../db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { solana } from "../utils/solana";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

// Get total number of transactions in the blockchain
router.get(
  "/count",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transactionCount = await solana.connection.getTransactionCount();
      res.json({ success: true, count: transactionCount });
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction by signature
router.get(
  "/:sig",
  async (req: Request<{ sig: string }>, res: Response, next: NextFunction) => {
    try {
      const { sig } = req.params;
      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

      // Try to get from cache first
      const cachedTx = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.signature, sig),
          gte(transactions.lastUpdated, sql`${cacheExpiry}`)
        ),
      });

      if (cachedTx) {
        res.json(cachedTx.data);
        return;
      }

      // If not in cache or expired, fetch from RPC
      const tx = await solana.connection.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      // Update cache in background
      const transactionData = {
        signature: sig,
        slot: tx.slot.toString(),
        data: tx,
        blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
        lastUpdated: new Date(),
      };

      db.insert(transactions)
        .values(transactionData)
        .onConflictDoUpdate({
          target: transactions.signature,
          set: {
            slot: tx.slot.toString(),
            data: tx,
            blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
            lastUpdated: new Date(),
          },
        })
        .catch((error) => {
          console.error("Error caching transaction:", error);
        });

      res.json(tx);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
