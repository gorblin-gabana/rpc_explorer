import { Request, Response } from 'express';
import { solana } from '../utils/solana';

export class HealthController {
  public async getHealth(_req: Request, res: Response) {
    try {
      // @ts-ignore
      const resp = await solana.connection._rpcRequest("getHealth", []);
      res.json({ ok: resp.result === "ok", raw: resp });
    } catch (e: any) {
      res.status(502).json({ ok: false, error: e.message });
    }
  }

  public async getLatestBlock(_req: Request, res: Response) {
    try {
      const bh = await solana.connection.getLatestBlockhash("confirmed");
      const slot = await solana.connection.getSlot("confirmed");
      const blockTime = await solana.connection.getBlockTime(slot);
      res.json({ slot, hash: bh.blockhash, blockTime });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
