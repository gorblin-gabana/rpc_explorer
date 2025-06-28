import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/config';
import { fees } from '../db/schema';
import { eq, gte, sql, desc } from 'drizzle-orm';
import { solana } from '../utils/solana';
import { v4 as uuidv4 } from 'uuid';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

// Get latest fees
router.get('/latest', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    
    // Try to get from cache first
    const cachedFees = await db.query.fees.findFirst({
      where: gte(fees.lastUpdated, sql`${cacheExpiry}`),
      orderBy: [desc(fees.lastUpdated)]
    });

    if (cachedFees) {
      res.json(cachedFees.data);
      return;
    }

    // If not in cache or expired, fetch from RPC
    const [blockhash, slot] = await Promise.all([
      solana.connection.getLatestBlockhash('confirmed'),
      solana.connection.getSlot('confirmed')
    ]);
    
    const feeCalculator = await solana.connection.getFeeCalculatorForBlockhash(
      blockhash.blockhash
    );
    
    const feesData = {
      slot,
      blockhash: blockhash.blockhash,
      feeCalculator: feeCalculator?.value || null,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
      lastUpdated: new Date().toISOString()
    };

    // Update cache in background
    const feeId = `fees-${slot}`;
    const feeRecord = {
      id: feeId,
      slot: slot.toString(),
      data: feesData,
      lastUpdated: new Date(),
    };

    db.insert(fees)
      .values(feeRecord)
      .onConflictDoUpdate({
        target: fees.id,
        set: { 
          data: feesData,
          lastUpdated: new Date(),
        },
      })
      .catch((error) => {
        console.error('Error caching fees:', error);
      });
    
    res.json(feesData);
  } catch (error) {
    next(error);
  }
});

export default router;
