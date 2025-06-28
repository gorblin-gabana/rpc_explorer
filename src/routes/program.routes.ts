import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/config";
import { programAccounts } from "../db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { solana } from "../utils/solana";
import { v4 as uuidv4 } from "uuid";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

// Get program accounts by program ID
router.get(
  "/:id/accounts",
  async (
    req: Request<
      { id: string },
      any,
      any,
      { datasize?: string; slice?: string; limit?: string; offset?: string }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { datasize, slice, limit = "100", offset = "0" } = req.query;
      const cacheKey = `${id}-${datasize || ""}-${
        slice || ""
      }-${limit}-${offset}`;

      const parsedLimit = Math.min(parseInt(limit, 10) || 100, 1000);
      const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

      // Try to get from cache first
      const programPubkey = solana.toPubkey(id);
      const cacheId = `${programPubkey.toBase58()}-${cacheKey}`;
      const cachedResult = await db.query.programAccounts.findFirst({
        where: and(
          eq(programAccounts.id, cacheId),
          gte(programAccounts.lastUpdated, sql`${cacheExpiry}`)
        ),
      });

      if (cachedResult) {
        res.json(cachedResult.data);
        return;
      }

      // If not in cache or expired, fetch from RPC
      const programId = solana.toPubkey(id);
      const filters = [];

      if (datasize) {
        filters.push({
          dataSize: parseInt(datasize, 10),
        });
      }

      const accounts = await solana.connection.getProgramAccounts(programId, {
        filters,
        dataSlice: slice
          ? {
              offset: 0,
              length: parseInt(slice, 10),
            }
          : undefined,
        commitment: "confirmed",
      });

      // Apply pagination
      const totalCount = accounts.length;
      const paginatedAccounts = accounts.slice(
        parsedOffset,
        parsedOffset + parsedLimit
      );

      const result = {
        data: paginatedAccounts.map((account) => ({
          pubkey: account.pubkey.toBase58(),
          account: {
            ...account.account,
            owner: account.account.owner.toBase58(),
            data: account.account.data.toString("base64"),
          },
        })),
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: totalCount,
          hasMore: parsedOffset + parsedLimit < totalCount,
          nextOffset:
            parsedOffset + parsedLimit < totalCount
              ? parsedOffset + parsedLimit
              : null,
          prevOffset:
            parsedOffset > 0 ? Math.max(0, parsedOffset - parsedLimit) : null,
        },
        count: paginatedAccounts.length,
      };

      // Update cache in background
      const cacheIdForUpdate = `${programId.toBase58()}-${cacheKey}`;
      const programAccountData = {
        id: cacheIdForUpdate,
        programId: programId.toBase58(),
        cacheKey,
        data: result,
        lastUpdated: new Date(),
      };

      db.insert(programAccounts)
        .values(programAccountData)
        .onConflictDoUpdate({
          target: programAccounts.id,
          set: {
            data: result,
            lastUpdated: new Date(),
          },
        })
        .catch((error) => {
          console.error("Error caching program accounts:", error);
        });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
