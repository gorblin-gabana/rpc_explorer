import { Connection, ConnectionConfig } from '@solana/web3.js';
import { config } from '../../config';

export class SolanaConnection {
  private static instance: SolanaConnection;
  private connection: Connection;

  private constructor() {
    const RPC_ENDPOINT = config.HTTPS_RPC;
    const WS_ENDPOINT = config.WS_ENDPOINT;
    this.connection = new Connection(RPC_ENDPOINT, {
      commitment: 'confirmed',
      wsEndpoint: WS_ENDPOINT,
      disableRetryOnRateLimit: false,
    });
  }

  public static getInstance(): SolanaConnection {
    if (!SolanaConnection.instance) {
      SolanaConnection.instance = new SolanaConnection();
    }
    return SolanaConnection.instance;
  }

  public getConnection(): Connection {
    return this.connection;
  }
}
