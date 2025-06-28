import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './routes';
import { handleError, notFound } from './middlewares/errorHandler';
import { specs } from './config/swagger';
import { clearDatabase } from '../scripts/clear-db';
import { Connection, PublicKey } from '@solana/web3.js';
import { listener } from './listener';

const app = express();
console.log("Inside app")
// Middleware
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// API Routes
app.use('/api', routes);
app.get("/txns/:address",async(req,res)=>{
  const RPC_ENDPOINT = 'https://rpc.gorbchain.xyz';
const WS_ENDPOINT = 'wss://rpc.gorbchain.xyz/ws/';
const connection = new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  wsEndpoint: WS_ENDPOINT,
  disableRetryOnRateLimit: false,
});
    try {
      const address = req.params.address as string;
        const transactions = await connection.getConfirmedSignaturesForAddress2(new PublicKey(address));
        res.json(transactions);
    } catch (error:any) {
        res.status(500).json({ error: error.message });
    }
})

// 404 handler
app.use(notFound);

// Error handler
app.use(handleError);

export const startServer = () => {
  // clear database
  listener();
  const server = app.listen(config.PORT, '0.0.0.0',() => {
    console.log(`Server is running on port: ${config.PORT}`);
    console.log(`API Documentation available at http://localhost:${config.PORT}/api-docs`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  return server;
};

startServer();

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';

// Gorbchain mainnet
const t = "https://rpc.gorbchain.xyz";
const connection = new Connection(t, "confirmed");

async function main() {


    const m = new PublicKey("uHR5b9KTeVMETb37VMNJx3FUtkj3rEJs5vZgVkaNxAy");
    // const mintInfo = await connection.getParsedAccountInfo(m);
    // console.log(mintInfo);
    // @ts-ignore
    // console.log(mintInfo.value.data.parsed);  // includes decimals, supply, etc. 
    const umi = createUmi(t).use(mplTokenMetadata());
    // console.log("Umi==>",umi);
    // @ts-ignore
    const asset = await fetchDigitalAsset(umi, m);
    console.log("ass==>",asset);
    console.log("====================>",asset.mint, "MetaDataaa============>",asset.metadata);



}
// main()