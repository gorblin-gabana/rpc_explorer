import swaggerJsdoc from 'swagger-jsdoc';
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gor API Cache Service',
      version: '1.0.0',
      description: 'A caching layer for Gorbchain RPC endpoints',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        TokenHolder: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The token account address',
            },
            amount: {
              type: 'string',
              description: 'The token balance as a string',
            },
            decimals: {
              type: 'number',
              description: 'Number of decimals configured for the token',
            },
            owner: {
              type: 'string',
              description: 'The owner of the token account',
            },
            isFrozen: {
              type: 'boolean',
              description: 'Whether the token account is frozen',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Error status',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (in development)',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const specs = swaggerJsdoc(options);
