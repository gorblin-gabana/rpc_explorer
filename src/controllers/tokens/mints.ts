import { Request, Response } from 'express';
import { TokenService } from '../../services/solana/token';

export class TokenMintsController {
  private tokenService = new TokenService();

  public getTokenMints = async (req: Request, res: Response) => {
    try {
      const mints = await this.tokenService.getTokenMints();
      res.json(mints);
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to fetch token mints',
        details: error.message 
      });
    }
  };
}
