import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/config';
import { transactionStatuses } from '../db/schema';
import { eq, gte, sql, and } from 'drizzle-orm';
import { solana } from '../utils/solana';
import { v4 as uuidv4 } from 'uuid';

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionStatusResponse:
 *       type: object
 *       properties:
 *         slot:
 *           type: number
 *           description: The slot at which the transaction was processed
 *         confirmations:
 *           type: number
 *           nullable: true
 *           description: Number of confirmations, null if finalized or failed
 *         err:
 *           type: object
 *           nullable: true
 *           description: Error if transaction failed, null if successful
 *         confirmationStatus:
 *           type: string
 *           enum: [processed, confirmed, finalized, failed]
 *           description: Current status of the transaction
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: When the status was last updated
 *         signature:
 *           type: string
 *           description: The transaction signature
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

/**
 * @swagger
 * /api/transactions/{signature}/status:
 *   get:
 *     summary: Get transaction status
 *     description: Returns the status of a transaction by its signature
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: signature
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction signature (base58-encoded)
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionStatusResponse'
 *       400:
 *         description: Invalid signature format
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get('/:sig/status', async (req: Request<{ sig: string }>, res: Response, next: NextFunction) => {
  try {
    const { sig } = req.params;
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    
    // Try to get from cache first
    const cachedStatus = await db.query.transactionStatuses.findFirst({
      where: and(
        eq(transactionStatuses.signature, sig),
        gte(transactionStatuses.lastUpdated, sql`${cacheExpiry}`)
      )
    });

    if (cachedStatus) {
      res.json(cachedStatus.data);
      return;
    }

    // If not in cache or expired, fetch from RPC
    const status = await solana.connection.getSignatureStatus(sig, {
      searchTransactionHistory: true,
    });
    
    if (!status || !status.value) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const statusData = {
      ...status.value,
      lastUpdated: new Date().toISOString()
    };

    // Update cache in background
    const statusId = `tx-status-${sig}`;
    const statusRecord = {
      id: statusId,
      signature: sig,
      data: statusData,
      lastUpdated: new Date(),
    };

    db.insert(transactionStatuses)
      .values(statusRecord)
      .onConflictDoUpdate({
        target: transactionStatuses.id,
        set: { 
          data: statusData,
          lastUpdated: new Date(),
        },
      })
      .catch((error) => {
        console.error(`Error caching transaction status for ${sig}:`, error);
      });
    
    res.json(statusData);
  } catch (error) {
    next(error);
  }
});

export default router;
