import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { BlockchainService } from '../services/blockchain';
import { toPubkey } from '../utils/pubkey';

export class BalanceController {
  private blockchainService = new BlockchainService();

  public getBalance = async (req: Request, res: Response) => {
    try {
      const pubkey = toPubkey(req.params.pubkey);
      const balance = await this.blockchainService.getBalance(pubkey);
      res.json(balance);
    } catch (error: any) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid public key or failed to fetch balance',
        details: error.message 
      });
    }
  };
}
