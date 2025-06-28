import { PublicKey } from '@solana/web3.js';

export function toPubkey(str: string): PublicKey {
  try { 
    return new PublicKey(str); 
  } catch (error) { 
    throw new Error(`Invalid public key: ${str}`); 
  }
}

export function validatePubkey(str: string): boolean {
  try {
    new PublicKey(str);
    return true;
  } catch {
    return false;
  }
}
