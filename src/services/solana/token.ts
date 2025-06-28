import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaConnection } from './connection';
import { ExtensionType, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getExtensionData, getMint, getTokenMetadata } from '@solana/spl-token';

import {
  unpack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

export const TOKEN_PROGRAM = new PublicKey(
  'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn'
);

const TOKEN_PROGRAM_ATA = new PublicKey(
  'CAQRHHqKTHPyhiSTUTxBvpcCmcFe6J3htW5MBAKJjCxs'
);
// 4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX

const MINT_SIZE = 82; // Change to 355 if the chain uses Token-2022

export class TokenService {
  private connection = SolanaConnection.getInstance().getConnection();

  async getTokenMints() {
    try {
      const accts = await this.connection.getProgramAccounts(TOKEN_PROGRAM, {
        dataSlice: { offset: 420, length: 0 }, // pubkeys only
        // filters: [{ dataSize: 630 }]
      });
      console.log("Account => ",accts);
      let supplyGreater0 = 0;
      const tokens = [];
      for (let i = 0; i < accts.length; i++) {
        const element = accts[i];
        // @ts-ignore
        let mintInfo;
        try {
          mintInfo =  await getMint(this.connection, element.pubkey, undefined, TOKEN_PROGRAM);
        } catch (error) {
          console.error("❌ Mint account not found");
        }
        let buffer;
        let serializedMintInfo;
        let metaData;

        if(mintInfo){
          buffer = Buffer.from(mintInfo.tlvData as any, "base64");
          console.log(buffer.toString("hex"))
          // Convert BigInt values to strings for JSON serialization
        serializedMintInfo = {
          ...mintInfo,
          supply: mintInfo.supply.toString(),
          decimals: mintInfo.decimals,
          mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
          freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
          isInitialized: mintInfo.isInitialized,
          tlvData: mintInfo.tlvData ? Buffer.from(mintInfo.tlvData as any).toString('base64') : null,
          decoded:buffer.toString("hex")
        };
        const metadataBuffer = getExtensionData(
          ExtensionType.TokenMetadata,
          mintInfo?.tlvData
        );
        if (metadataBuffer) {
          metaData = unpack(metadataBuffer);
      
        console.log("✅ Token Metadata:");
        console.log("🪪 Name:", metaData.name);
        console.log("🔤 Symbol:", metaData.symbol);
        console.log("🌐 URI:", metaData.uri);
        }
      
        // Step 3: Decode the buffer into structured metadata
        

        if (mintInfo.supply > 0) {
          supplyGreater0++;
        }
        

        }
        

        // const mintInfo1 = await this.connection.getAccountInfo(element.pubkey);
        // if (!mintInfo) {
        //   console.error("❌ Mint account not found");
        //   return;
        // }
      
        // Step 2: Get the TLV extension buffer
        
        
          tokens.push({
            address: element.pubkey.toBase58(),
            mintInfo: serializedMintInfo,
            metaData: metaData
          });
        }
      
      
      return {
        tokens: tokens,
        count: tokens.length,
        supplyGreater0: supplyGreater0
      };
    }catch(error){
      console.error(`Error fetching token mints:`, error);
      throw error;
    }
  }


  /**
   * Get the total supply of a token by its mint address
   * @param mintAddress The mint address of the token
   * @returns Token supply information including amount, decimals, and UI amount
   */
  async getTokenSupply(mintAddress: string) {
    try {
      const mint = await getMint(this.connection, new PublicKey(mintAddress));
      console.log("mint => ",mint);
      return mint;
    } catch (error) {
      console.error(`Error fetching token supply for ${mintAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get token accounts for a specific owner
   * @param owner The owner's public key
   * @returns Array of token accounts
   */
  async getTokenAccounts(owner: PublicKey) {
    const list = await this.connection.getTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM
    });
    return list.value;
  }

  /**
   * Get the associated token account address for a wallet and token mint
   * @param owner The wallet public key (can be base58 string or PublicKey)
   * @param mint The token mint public key (can be base58 string or PublicKey)
   * @returns The associated token account address as base58 string
   */
  async getAssociatedTokenAddress(owner: string | PublicKey, mint: string | PublicKey): Promise<string> {
    try {
      const ownerPubkey = typeof owner === 'string' ? new PublicKey(owner) : owner;
      const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      
      const ata = await getAssociatedTokenAddress(
        mintPubkey,     // mint
        ownerPubkey,    // owner
        false,          // allowOwnerOffCurve - set to true if you want to allow owner to be a PDA
        TOKEN_PROGRAM   // token program ID
      );
      
      return ata.toBase58();
    } catch (error) {
      console.error('Error getting associated token account:', error);
      throw error;
    }
  }
  
}
