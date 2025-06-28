import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/config';
import { tokens } from '../db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { solana } from '../utils/solana';
import { v4 as uuidv4 } from 'uuid';

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenSupplyResponse:
 *       type: object
 *       properties:
 *         amount:
 *           type: string
 *           description: The raw supply amount as a string
 *         decimals:
 *           type: number
 *           description: Number of decimals configured for the token
 *         uiAmount:
 *           type: string
 *           description: The supply amount in user-friendly format (considering decimals)
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: When the supply data was last updated
 *         mint:
 *           type: string
 *           description: The token mint address
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

/**
 * @swagger
 * /api/tokens/{mint}/supply:
 *   get:
 *     summary: Get token supply information
 *     description: Returns the current supply information for the specified token mint
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: mint
 *         schema:
 *           type: string
 *         required: true
 *         description: The token mint address
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenSupplyResponse'
 *       400:
 *         description: Invalid mint address
 *       404:
 *         description: Token not found
 *       500:
 *         description: Server error
 */
router.get('/:mint/supply', async (req: Request<{ mint: string }>, res: Response, next: NextFunction) => {
  try {
    const { mint } = req.params;
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    
    // Try to get from cache first
    const cachedToken = await db.query.tokens.findFirst({
      where: and(
        eq(tokens.mintAddress, mint),
        gte(tokens.lastUpdated, sql`${cacheExpiry}`)
      )
    });

    if (cachedToken && cachedToken.supply && cachedToken.decimals) {
      res.json({
        amount: cachedToken.supply,
        decimals: Number(cachedToken.decimals),
        uiAmount: (Number(cachedToken.supply) / Math.pow(10, Number(cachedToken.decimals))).toString(),
        lastUpdated: cachedToken.lastUpdated.toISOString(),
        mint: mint
      });
      return;
    }

    // If not in cache or expired, fetch from RPC
    const supply = await solana.connection.getTokenSupply(solana.toPubkey(mint));
    
    if (!supply || !supply.value) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    const supplyData = {
      ...supply.value,
      amount: supply.value.amount.toString(),
      uiAmount: supply.value.uiAmount?.toString(),
      lastUpdated: new Date().toISOString()
    };

    // Update cache in background
    db.insert(tokens)
      .values({
        mintAddress: mint,
        supply: supplyData.amount,
        decimals: supplyData.decimals.toString(),
        metadata: {},
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: tokens.mintAddress,
        set: { 
          supply: supplyData.amount,
          decimals: supplyData.decimals.toString(),
          lastUpdated: new Date(),
        },
      })
      .catch(console.error);
    
    res.json(supplyData);
  } catch (error) {
    next(error);
  }
});

export default router;
