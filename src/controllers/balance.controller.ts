import { Request, Response } from 'express';
import { solana } from '../utils/solana';

export class BalanceController {
  public async getBalance(req: Request, res: Response) {
    try {
      const pubkey = solana.toPubkey(req.params.pubkey);
      const lamports = await solana.connection.getBalance(pubkey, "confirmed");
      res.json({ lamports, sol: lamports / 1_000_000_000 });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
