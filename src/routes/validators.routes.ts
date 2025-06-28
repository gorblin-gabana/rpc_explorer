import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/config';
import { validators } from '../db/schema';
import { eq, gte, sql, and } from 'drizzle-orm';
import { solana } from '../utils/solana';
import { PublicKey } from '@solana/web3.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const router = Router();

// Get cluster nodes (validators)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);
    
    // Try to get from cache first
    const cachedValidators = await db.query.validators.findMany({
      where: gte(validators.lastUpdated, sql`${cacheExpiry}`)
    });

    if (cachedValidators.length > 0) {
      res.json(cachedValidators.map(v => ({
        ...v,
        pubkey: v.pubkey,
        nodePubkey: v.nodePubkey,
        activatedStake: v.activatedStake,
        commission: v.commission,
        epochVoteAccount: v.epochVoteAccount,
        epochCredits: v.epochCredits,
        lastVote: v.lastVote,
        data: v.data
      })));
      return;
    }

    // If not in cache or expired, fetch from RPC
    const clusterNodes = await solana.connection.getClusterNodes();
    
    // Update cache in background
    const validatorUpdates = clusterNodes.map(async (node) => {
      const pubkey = new PublicKey(node.pubkey).toBase58();
      const nodePubkey = node.gossip ? new PublicKey(node.gossip).toBase58() : null;
      
      const validatorData = {
        pubkey,
        nodePubkey,
        activatedStake: null, // Will be updated separately if needed
        commission: null, // Will be updated separately if needed
        epochVoteAccount: false, // Will be updated separately if needed
        epochCredits: null, // Will be updated separately if needed
        lastVote: null, // Will be updated separately if needed
        data: node,
        lastUpdated: new Date(),
      };

      await db.insert(validators)
        .values(validatorData)
        .onConflictDoUpdate({
          target: validators.pubkey,
          set: { 
            nodePubkey: validatorData.nodePubkey,
            data: validatorData.data,
            lastUpdated: new Date(),
          },
        })
        .catch((error) => {
          console.error(`Error caching validator ${pubkey}:`, error);
        });
    });

    // Wait for all updates to complete
    await Promise.all(validatorUpdates);
    
    // Return the cluster nodes data
    res.json(clusterNodes);
  } catch (error) {
    next(error);
  }
});

export default router;
