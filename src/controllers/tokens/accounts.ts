import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { TokenService } from '../../services/solana/token';
import { toPubkey } from '../../utils/pubkey';

export class TokenAccountsController {
  private tokenService = new TokenService();

  public getTokenAccounts = async (req: Request, res: Response) => {
    try {
      const owner = toPubkey(req.params.owner);
      const accounts = await this.tokenService.getTokenAccounts(owner);
      res.json(accounts);
    } catch (error: any) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid owner public key or failed to fetch token accounts',
        details: error.message 
      });
    }
  };
}
