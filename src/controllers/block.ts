import { Request, Response } from "express";
import { db } from "../db/config";
import { blocks } from "../db/schema";
import { eq, gte, sql, and } from "drizzle-orm";
import { solana } from "../utils/solana";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

interface BlockData {
  slot: number;
  blockhash: string;
  blockTime: number | null;
  parentSlot: number;
  blockHeight: number | null;
  [key: string]: any;
}

export class BlockController {
  public async getLatestBlock(_req: Request, res: Response): Promise<void> {
    try {
      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

      // Try to get from cache first
      const cachedBlock = await db.query.blocks.findFirst({
        where: gte(blocks.lastUpdated, sql`${cacheExpiry}`),
        orderBy: (blocks, { desc }) => [desc(blocks.slot)],
      });

      if (cachedBlock) {
        res.json(cachedBlock.data);
        return;
      }

      // If not in cache or expired, fetch from RPC
      const slot = await solana.connection.getSlot("confirmed");
      const block = await solana.connection.getBlock(slot);

      if (!block) {
        res.status(404).json({ error: "Block not found" });
        return;
      }

      const blockData = this.formatBlockData(block);

      // Update cache in background
      this.updateBlockCache(blockData).catch(console.error);

      res.json(blockData);
    } catch (error: any) {
      console.error("Error in getLatestBlock:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch latest block",
        details: error.message,
      });
    }
  }

  public async getBlockBySlot(
    req: Request<{ slot: string }>,
    res: Response
  ): Promise<void> {
    try {
      const slot = parseInt(req.params.slot);
      if (isNaN(slot)) {
        res.status(400).json({ error: "Invalid slot number" });
        return;
      }

      const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

      // Try to get from cache first
      const cachedBlock = await db.query.blocks.findFirst({
        where: and(
          eq(blocks.slot, slot.toString()),
          gte(blocks.lastUpdated, sql`${cacheExpiry}`)
        ),
      });

      if (cachedBlock) {
        res.json(cachedBlock.data);
        return;
      }

      // If not in cache or expired, fetch from RPC
      const block = await solana.connection.getBlock(slot);

      if (!block) {
        res.status(404).json({ error: "Block not found" });
        return;
      }

      const blockData = this.formatBlockData(block);

      // Update cache in background
      this.updateBlockCache(blockData).catch(console.error);

      res.json(blockData);
    } catch (error: any) {
      console.error("Error in getBlockBySlot:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch block",
        details: error.message,
      });
    }
  }

  private formatBlockData(block: any): BlockData {
    return {
      ...block,
      slot: block.slot,
      blockhash: block.blockhash,
      parentSlot: block.parentSlot,
      blockTime: block.blockTime || null,
      blockHeight: block.blockHeight || null,
      blockTimeFormatted: block.blockTime
        ? new Date(block.blockTime * 1000).toISOString()
        : null,
    };
  }

  private async updateBlockCache(blockData: BlockData): Promise<void> {
    try {
      const blockToInsert = {
        slot: blockData.slot.toString(),
        parentSlot: blockData.parentSlot
          ? blockData.parentSlot.toString()
          : null,
        blockTime: blockData.blockTime
          ? new Date(blockData.blockTime * 1000)
          : null,
        blockHeight: blockData.blockHeight
          ? blockData.blockHeight.toString()
          : null,
        data: blockData,
        lastUpdated: new Date(),
      };

      await db
        .insert(blocks)
        .values(blockToInsert)
        .onConflictDoUpdate({
          target: blocks.slot,
          set: {
            parentSlot: blockToInsert.parentSlot,
            blockTime: blockToInsert.blockTime,
            blockHeight: blockToInsert.blockHeight,
            data: blockToInsert.data,
            lastUpdated: blockToInsert.lastUpdated,
          },
        });
    } catch (error) {
      console.error("Error updating block cache:", error);
      throw error;
    }
  }
}
