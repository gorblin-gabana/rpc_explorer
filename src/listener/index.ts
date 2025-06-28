import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "../config";

export async function listener(){
   try {
    const RPC_ENDPOINT = config.HTTPS_RPC;
    const WS_ENDPOINT = config.WS_ENDPOINT;
    const conn = new Connection(RPC_ENDPOINT, {
        commitment: 'confirmed',
        wsEndpoint: WS_ENDPOINT,
        disableRetryOnRateLimit: false,
      });
      console.log("Inside listener");

      // listen to the perticuler address
      const address = new PublicKey("FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn");
      // conn.onSignature("", (accountInfo) => {
      //   console.log(accountInfo);
      // });

      // conn.onLogs("all",(logs)=>{
      //   console.log(logs);
      // })

   } catch (error) {
    console.log(error);
   }
    
}
