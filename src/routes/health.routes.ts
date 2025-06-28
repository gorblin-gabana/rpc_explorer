import { Router } from 'express';
import { HealthController } from '../controllers/health';

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.getHealth);

export default router;
