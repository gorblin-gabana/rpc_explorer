import { Router, Request, Response, NextFunction } from 'express';
import { BlockController } from '../controllers/block';

const router = Router();
const blockController = new BlockController();

// Get latest block
router.get('/latest', (req: Request, res: Response, next: NextFunction) => {
  blockController.getLatestBlock(req, res).catch(next);
});

// Get block by slot
router.get('/:slot', (req: Request<{ slot: string }>, res: Response, next: NextFunction) => {
  blockController.getBlockBySlot(req, res).catch(next);
});

// Error handling middleware
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Block route error:', err);
  res.status(500).json({ 
    status: 'error',
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default router;
