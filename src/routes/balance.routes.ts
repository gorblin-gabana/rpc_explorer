import { Router } from 'express';
import { BalanceController } from '../controllers/balance';

const router = Router();
const balanceController = new BalanceController();

router.get('/:pubkey', balanceController.getBalance);

export default router;
