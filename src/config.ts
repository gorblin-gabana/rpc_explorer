import "dotenv/config";

export const config = {
    HTTPS_RPC: process.env.HTTPS_RPC as string,
    PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
    DATABASE_URL: process.env.DATABASE_URL as string,
    WS_ENDPOINT: process.env.WS_ENDPOINT as string,
}