import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/config';
import { slots } from '../db/schema';
import { eq, gte, sql, desc } from 'drizzle-orm';
import { solana } from '../utils/solana';
import { v4 as uuidv4 } from 'uuid';

const CACHE_TTL_MS = 5 * 1000; // 5 seconds cache TTL (slots change frequently)

const router = Router();

// Get current slot
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    
    // Try to get from cache first
    const cachedSlot = await db.query.slots.findFirst({
      where: gte(slots.lastUpdated, sql`${cacheExpiry}`),
      orderBy: [desc(slots.lastUpdated)]
    });

    if (cachedSlot) {
      res.json({ slot: cachedSlot.slot });
      return;
    }

    // If not in cache or expired, fetch from RPC
    const slot = await solana.connection.getSlot('confirmed');
    
    // Update cache in background
    const slotStr = slot.toString();
    const slotData = {
      id: uuidv4(),
      slot: slotStr,
      lastUpdated: new Date(),
    };

    db.insert(slots)
      .values(slotData)
      .onConflictDoUpdate({
        target: slots.id,
        set: { 
          slot: slotStr,
          lastUpdated: new Date(),
        },
      })
      .catch((error) => {
        console.error('Error caching slot:', error);
      });
    
    res.json({ slot });
  } catch (error) {
    next(error);
  }
});

export default router;
