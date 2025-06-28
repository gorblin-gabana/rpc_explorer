import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "../config";

class SolanaConnection {
  private static instance: SolanaConnection;
  public connection: Connection;

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

  public toPubkey(str: string): PublicKey {
    try {
      return new PublicKey(str);
    } catch (error) {
      throw new Error(`Invalid public key: ${str}`);
    }
  }
}

export const solana = SolanaConnection.getInstance();
