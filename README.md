# GORB Indexer

A comprehensive Gorbchain blockchain indexer and API service for the GORB chain, providing easy access to blockchain data including tokens, accounts, transactions, and more.

## Features

- **Token Management**: Fetch and analyze token mints, metadata, and token holders
- **Account Tracking**: Monitor account balances and transactions
- **Block Data**: Access detailed block information and slot data
- **Program Interaction**: Interact with on-chain programs
- **Transaction Monitoring**: Track transaction statuses and details
- **Analytics**: Get insights into blockchain activity
- **WebSocket Support**: Real-time event listening
- **RESTful API**: Easy integration with frontend applications
- **Swagger Documentation**: Interactive API documentation

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Blockchain**: Gorbchain Web3.js, @solana/spl-token
- **Database**: PostgreSQL with Drizzle ORM
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker (configurable)

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL database
- Gorbchain CLI (optional, for local development)

### Running the Application

- **Development mode**:
  ```bash
  npm run dev
  ```

- **Production build**:
  ```bash
  npm run build
  npm start
  ```

The API will be available at `http://localhost:3000` by default.

## API Documentation

Interactive API documentation is available at `/api-docs` when the server is running.

### Available Endpoints

- **Health**: `GET /api/health`
- **Tokens**: 
  - `GET /api/tokens/mints` - Get all token mints
  - `GET /api/tokens/:address` - Get token details by address
- **Accounts**: 
  - `GET /api/accounts/:address` - Get account details
  - `GET /api/accounts/:address/transactions` - Get account transactions
- **Blocks**: 
  - `GET /api/blocks/latest` - Get latest block
  - `GET /api/blocks/:slot` - Get block by slot number
- **Transactions**: 
  - `GET /api/transactions/:signature` - Get transaction details

## Event Listener

The application includes a WebSocket-based event listener that can monitor:
- Account changes
- Program logs
- Token mints and transfers

To enable the event listener, uncomment the relevant code in `src/app.ts`.

## Development

### Testing

Run tests with:
```bash
npm test
```

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

### Directory Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── db/               # Database models and migrations
├── middlewares/      # Express middlewares
├── routes/           # API route definitions
├── services/         # Business logic
│   └── solana/       # Gorbchain-specific services
├── utils/            # Utility functions
└── app.ts            # Express application setup
```

## Deployment

### Docker

A `Dockerfile` is provided for containerized deployment:

```bash
docker build -t gor-idx .
docker run -p 3000:3000 --env-file .env gor-idx
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection URL | - |
| RPC_ENDPOINT | Gorbchain RPC endpoint | - |
| WS_ENDPOINT | WebSocket endpoint | - |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Solana Web3.js
- Express.js
- Drizzle ORM
- GORB Chain Community