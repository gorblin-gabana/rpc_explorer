import { PublicKey } from '@solana/web3.js';
import { SolanaConnection } from './solana/connection';

export class BlockchainService {
  private connection = SolanaConnection.getInstance().getConnection();

  async getHealth() {
    // @ts-ignore
    return this.connection?._rpcRequest("getHealth", []);
  }

  async getLatestBlockInfo() {
    const blockhash = await this.connection.getLatestBlockhash('confirmed');
    const slot = await this.connection.getSlot('confirmed');
    const blockTime = await this.connection.getBlockTime(slot);
    return { slot, hash: blockhash.blockhash, blockTime };
  }

  async getBalance(pubkey: PublicKey) {
    const lamports = await this.connection.getBalance(pubkey, 'confirmed');
    return { lamports, sol: lamports / 1_000_000_000 };
  }
}
