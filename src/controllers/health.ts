import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';

export class HealthController {
  private blockchainService = new BlockchainService();

  public getHealth = async (req: Request, res: Response) => {
    try {
      await this.blockchainService.getHealth();
      res.json({ status: 'ok' });
    } catch (error: any) {
      res.status(502).json({ 
        status: 'error',
        message: 'Node is unhealthy',
        details: error.message 
      });
    }
  };
}
