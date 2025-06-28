import { Router } from 'express';
import { TokenMintsController, TokenAccountsController } from '../controllers/tokens';

const router = Router();
const tokenMintsController = new TokenMintsController();
const tokenAccountsController = new TokenAccountsController();

// GET /tokens/mints - List all token mints
router.get('/mints', tokenMintsController.getTokenMints);

// GET /tokens/:owner/accounts - Get token accounts for an owner
router.get('/:owner/accounts', tokenAccountsController.getTokenAccounts);

export default router;
