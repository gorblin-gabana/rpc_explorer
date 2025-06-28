# 🚀 Gorbchain API - Frontend Developer Guide

A comprehensive guide to all available API endpoints for your Gorbchain blockchain application.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Error Handling](#error-handling)
- [Health & Status](#health--status)
- [Account Endpoints](#account-endpoints)
- [Transaction Endpoints](#transaction-endpoints)
- [Block & Slot Endpoints](#block--slot-endpoints)
- [Token Endpoints](#token-endpoints)
- [Program Endpoints](#program-endpoints)
- [Validator Endpoints](#validator-endpoints)
- [Fee Endpoints](#fee-endpoints)
- [Response Formats](#response-formats)
- [Frontend Integration Examples](#frontend-integration-examples)

## 🌐 Base URL

```
Production: https://your-api-domain.com/api
Development: http://localhost:3000/api
```

## 🔐 Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

## ⚡ Rate Limiting

- All endpoints are cached for optimal performance
- Cache TTL varies by endpoint (5 seconds to 5 minutes)
- No explicit rate limits currently enforced

## 📄 Pagination

The API supports multiple types of pagination:

### 🔄 **Cursor-Based Pagination**

Used for time-ordered data (transactions, signatures):

- `before` - Start searching backwards from this cursor
- `until` - Stop searching at this cursor
- `limit` - Maximum items to return

### 📊 **Offset-Based Pagination**

Used for static collections (program accounts):

- `offset` - Number of items to skip
- `limit` - Maximum items to return

### 📏 **Limit-Based Pagination**

Used for simple collections (token holders):

- `limit` - Maximum items to return

### 📈 **Pagination Response Format**

```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "hasMore": true,
    "nextCursor": "cursor_value",
    "prevCursor": "cursor_value",
    // OR for offset-based:
    "offset": 0,
    "total": 1000,
    "nextOffset": 50,
    "prevOffset": null
  },
  "count": 50
}
```

## 🚨 Error Handling

All endpoints return consistent error formats:

```json
{
  "status": "error",
  "message": "Error description",
  "details": "Additional error details (development only)"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Resource not found
- `500` - Internal server error

---

## 🏥 Health & Status

### GET `/health`

Check API health status.

**Response:**

```json
{
  "status": "ok"
}
```

**Frontend Usage:**

```javascript
const checkHealth = async () => {
  const response = await fetch("/api/health");
  const data = await response.json();
  return data.status === "ok";
};
```

---

## 👤 Account Endpoints

### GET `/account/:pubkey/info`

Get detailed account information.

**Parameters:**

- `pubkey` (string) - Account public key

**Response:**

```json
{
  "executable": false,
  "lamports": 1000000000,
  "owner": "11111111111111111111111111111112",
  "rentEpoch": "361",
  "data": "base64-encoded-data"
}
```

**Frontend Usage:**

```javascript
const getAccountInfo = async (publicKey) => {
  const response = await fetch(`/api/account/${publicKey}/info`);
  if (!response.ok) throw new Error("Account not found");
  return await response.json();
};
```

### GET `/account/:pubkey/transactions` 📄

Get transaction history for an account with **cursor-based pagination**.

**Parameters:**

- `pubkey` (string) - Account public key

**Query Parameters:**

- `limit` (number, optional) - Max transactions to return (default: 10, max: 1000)
- `before` (string, optional) - Start searching backwards from this signature
- `until` (string, optional) - Stop searching at this signature

**Response:**

```json
{
  "data": [
    {
      "signature": "5j7s1QzqC5QjB8TxWx5D...",
      "slot": 150000000,
      "blockTime": 1640995200,
      "err": null
    }
  ],
  "pagination": {
    "limit": 10,
    "hasMore": true,
    "before": null,
    "until": null,
    "nextCursor": "5j7s1QzqC5QjB8TxWx5D...",
    "prevCursor": "5j7s1QzqC5QjB8TxWx5D..."
  },
  "count": 10
}
```

**Frontend Usage:**

```javascript
const getAccountTransactions = async (publicKey, limit = 10, before = null) => {
  let url = `/api/account/${publicKey}/transactions?limit=${limit}`;
  if (before) url += `&before=${before}`;

  const response = await fetch(url);
  return await response.json();
};

// Pagination example
const loadMoreTransactions = async (publicKey, currentData) => {
  const nextCursor = currentData.pagination.nextCursor;
  if (!nextCursor || !currentData.pagination.hasMore) return null;

  return await getAccountTransactions(publicKey, 10, nextCursor);
};
```

### POST `/account/batch`

Get information for multiple accounts at once.

**Request Body:**

```json
{
  "pubkeys": ["pubkey1", "pubkey2", "pubkey3"]
}
```

**Response:**

```json
[
  {
    "pubkey": "pubkey1",
    "account": {
      "executable": false,
      "lamports": 1000000000,
      "owner": "11111111111111111111111111111112",
      "rentEpoch": "361",
      "data": "base64-data"
    }
  }
]
```

**Frontend Usage:**

```javascript
const getBatchAccountInfo = async (publicKeys) => {
  const response = await fetch("/api/account/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkeys: publicKeys }),
  });
  return await response.json();
};
```

### GET `/balance/:pubkey`

Get SOL balance for an account.

**Parameters:**

- `pubkey` (string) - Account public key

**Response:**

```json
{
  "balance": 1.5,
  "lamports": 1500000000
}
```

---

## 💳 Transaction Endpoints

### GET `/tx/count`

Get total number of transactions in the blockchain.

**Response:**

```json
{
  "success": true,
  "count": 123456789
}
```

### GET `/tx/:sig`

Get detailed transaction information.

**Parameters:**

- `sig` (string) - Transaction signature

**Response:**

```json
{
  "blockTime": 1640995200,
  "slot": 150000000,
  "transaction": {
    "message": {...},
    "signatures": ["5j7s1QzqC5QjB8TxWx5D..."]
  },
  "meta": {
    "err": null,
    "fee": 5000,
    "preBalances": [1000000000],
    "postBalances": [999995000]
  }
}
```

**Frontend Usage:**

```javascript
const getTransaction = async (signature) => {
  const response = await fetch(`/api/tx/${signature}`);
  if (!response.ok) throw new Error("Transaction not found");
  return await response.json();
};
```

### POST `/tx/batch`

Get multiple transaction details at once.

**Request Body:**

```json
{
  "signatures": ["sig1", "sig2", "sig3"]
}
```

**Response:**

```json
[
  {
    "signature": "sig1",
    "transaction": {...}
  }
]
```

### GET `/tx/:sig/status`

Get transaction confirmation status.

**Parameters:**

- `sig` (string) - Transaction signature

**Response:**

```json
{
  "slot": 150000000,
  "confirmations": null,
  "err": null,
  "confirmationStatus": "finalized"
}
```

---

## 📦 Block & Slot Endpoints

### GET `/block/latest`

Get the latest block information.

**Response:**

```json
{
  "blockhash": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "previousBlockhash": "FSHp4bE4dvcgSDbPbWKyq4yW9np7UBZ4QZLBYsNbEXdh",
  "parentSlot": 149999999,
  "transactions": [...],
  "blockTime": 1640995200
}
```

### GET `/block/:slot`

Get block information by slot number.

**Parameters:**

- `slot` (number) - Slot number

### GET `/slot`

Get current slot number.

**Response:**

```json
{
  "slot": 150000000
}
```

---

## 🪙 Token Endpoints

### GET `/tokens/mints`

Get list of all token mints.

**Response:**

```json
[
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "So11111111111111111111111111111111111111112"
]
```

### GET `/tokens/:owner/accounts`

Get all token accounts owned by an address.

**Parameters:**

- `owner` (string) - Owner public key

**Response:**

```json
[
  {
    "pubkey": "token-account-address",
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "owner": "owner-address",
    "amount": "1000000000",
    "decimals": 6
  }
]
```

### GET `/token/:mint/supply`

Get token supply information.

**Parameters:**

- `mint` (string) - Token mint address

**Response:**

```json
{
  "amount": "1000000000000",
  "decimals": 6,
  "uiAmount": "1000000",
  "lastUpdated": "2023-01-01T00:00:00.000Z",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}
```

### GET `/token/:mint/holders` 📄

Get token holders list with **limit-based pagination**.

**Parameters:**

- `mint` (string) - Token mint address

**Query Parameters:**

- `limit` (number, optional) - Max holders to return (default: 100, max: 1000)

**Response:**

```json
{
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "holders": [
    {
      "address": "token-account-address",
      "amount": "1000000000",
      "decimals": 6,
      "owner": "owner-address",
      "isFrozen": false
    }
  ],
  "total": "1000000000000",
  "limit": 100,
  "lastUpdated": "2023-01-01T00:00:00.000Z"
}
```

---

## 🖥️ Program Endpoints

### GET `/program/:id/accounts` 📄

Get all accounts owned by a program with **offset-based pagination**.

**Parameters:**

- `id` (string) - Program ID

**Query Parameters:**

- `datasize` (number, optional) - Filter by account data size
- `slice` (number, optional) - Limit data slice length
- `limit` (number, optional) - Max accounts to return (default: 100, max: 1000)
- `offset` (number, optional) - Number of accounts to skip (default: 0)

**Response:**

```json
{
  "data": [
    {
      "pubkey": "account-address",
      "account": {
        "executable": false,
        "lamports": 1000000,
        "owner": "program-id",
        "rentEpoch": 361,
        "data": "base64-encoded-data"
      }
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 5000,
    "hasMore": true,
    "nextOffset": 100,
    "prevOffset": null
  },
  "count": 100
}
```

**Frontend Usage:**

```javascript
const getProgramAccounts = async (programId, limit = 100, offset = 0) => {
  const response = await fetch(
    `/api/program/${programId}/accounts?limit=${limit}&offset=${offset}`
  );
  return await response.json();
};

// Pagination example
const loadNextPage = async (programId, currentData) => {
  const nextOffset = currentData.pagination.nextOffset;
  if (nextOffset === null || !currentData.pagination.hasMore) return null;

  return await getProgramAccounts(programId, 100, nextOffset);
};
```

---

## 🏛️ Validator Endpoints

### GET `/validators`

Get cluster validators information.

**Response:**

```json
[
  {
    "pubkey": "validator-pubkey",
    "gossip": "127.0.0.1:8001",
    "tpu": "127.0.0.1:8003",
    "rpc": "127.0.0.1:8899",
    "version": "1.14.0"
  }
]
```

---

## 💰 Fee Endpoints

### GET `/fees/latest`

Get current fee information.

**Response:**

```json
{
  "slot": 150000000,
  "blockhash": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "feeCalculator": {
    "lamportsPerSignature": 5000
  },
  "lastValidBlockHeight": 150000100,
  "lastUpdated": "2023-01-01T00:00:00.000Z"
}
```

---

## 📝 Response Formats

### Success Response

```json
{
  "data": {...},
  "status": "success"
}
```

### Paginated Response

```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "hasMore": true,
    "nextCursor": "cursor_value"
  },
  "count": 50
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "details": "Additional details (dev only)"
}
```

---

## 🌐 Frontend Integration Examples

### React Hook for Paginated Data

```javascript
import { useState, useEffect, useCallback } from "react";

const usePaginatedData = (endpoint, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (params = {}, append = false) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...initialParams,
          ...params,
        });
        const response = await fetch(`${endpoint}?${queryParams}`);

        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();

        if (append && result.data) {
          setData((prev) => [...prev, ...result.data]);
        } else {
          setData(result.data || result);
        }

        setPagination(result.pagination || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, initialParams]
  );

  const loadMore = useCallback(() => {
    if (!pagination || !pagination.hasMore) return;

    const nextParams = pagination.nextCursor
      ? { before: pagination.nextCursor }
      : { offset: pagination.nextOffset };

    fetchData(nextParams, true);
  }, [fetchData, pagination]);

  const reset = useCallback(() => {
    setData([]);
    setPagination(null);
    setError(null);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    loadMore,
    reset,
    refetch: fetchData,
  };
};
```

### Transaction History Component

```javascript
const TransactionHistory = ({ publicKey }) => {
  const {
    data: transactions,
    pagination,
    loading,
    error,
    loadMore,
  } = usePaginatedData(`/api/account/${publicKey}/transactions`, { limit: 20 });

  if (loading && transactions.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      <div className="transactions-list">
        {transactions.map((tx) => (
          <div key={tx.signature} className="transaction-item">
            <div className="signature">
              <strong>Signature:</strong> {tx.signature.slice(0, 20)}...
            </div>
            <div className="details">
              <span>Slot: {tx.slot}</span>
              <span>
                Time: {new Date(tx.blockTime * 1000).toLocaleString()}
              </span>
              <span className={tx.err ? "error" : "success"}>
                {tx.err ? "Failed" : "Success"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {pagination?.hasMore && (
        <button onClick={loadMore} disabled={loading} className="load-more-btn">
          {loading ? "Loading..." : "Load More"}
        </button>
      )}

      <div className="pagination-info">
        Showing {transactions.length} transactions
        {pagination?.hasMore && " (more available)"}
      </div>
    </div>
  );
};
```

### Program Accounts Explorer

```javascript
const ProgramAccountsExplorer = ({ programId }) => {
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ datasize: "", limit: 50 });

  const fetchAccounts = async (offset = 0, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: filters.limit,
        offset: offset,
        ...(filters.datasize && { datasize: filters.datasize }),
      });

      const response = await fetch(
        `/api/program/${programId}/accounts?${params}`
      );
      const result = await response.json();

      if (append) {
        setAccounts((prev) => [...prev, ...result.data]);
      } else {
        setAccounts(result.data);
      }

      setPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setAccounts([]);
    fetchAccounts(0, false);
  };

  const loadNextPage = () => {
    if (pagination?.nextOffset !== null) {
      fetchAccounts(pagination.nextOffset, true);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [programId]);

  return (
    <div className="program-accounts-explorer">
      <h3>Program Accounts</h3>

      {/* Filters */}
      <div className="filters">
        <input
          type="number"
          placeholder="Data size filter"
          value={filters.datasize}
          onChange={(e) =>
            handleFilterChange({ ...filters, datasize: e.target.value })
          }
        />
        <select
          value={filters.limit}
          onChange={(e) =>
            handleFilterChange({ ...filters, limit: e.target.value })
          }
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Results */}
      <div className="accounts-grid">
        {accounts.map((account) => (
          <div key={account.pubkey} className="account-card">
            <div className="account-header">
              <strong>{account.pubkey.slice(0, 20)}...</strong>
            </div>
            <div className="account-details">
              <p>Lamports: {account.account.lamports.toLocaleString()}</p>
              <p>Executable: {account.account.executable ? "Yes" : "No"}</p>
              <p>Data Length: {account.account.data.length} bytes</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination-controls">
        {pagination && (
          <div className="pagination-info">
            Showing {accounts.length} of {pagination.total} accounts
          </div>
        )}

        {pagination?.hasMore && (
          <button onClick={loadNextPage} disabled={loading}>
            Load More ({pagination.total - accounts.length} remaining)
          </button>
        )}
      </div>
    </div>
  );
};
```

### Transaction Status Poller

```javascript
const useTransactionStatus = (signature) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollStatus = useCallback(
    async (maxAttempts = 30) => {
      setLoading(true);
      setError(null);

      for (let i = 0; i < maxAttempts; i++) {
        try {
          const response = await fetch(`/api/tx/${signature}/status`);
          const statusData = await response.json();

          setStatus(statusData);

          if (statusData.confirmationStatus === "finalized") {
            setLoading(false);
            return statusData;
          }

          if (statusData.err) {
            setError("Transaction failed");
            setLoading(false);
            return statusData;
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          console.error("Polling error:", err);
          if (i === maxAttempts - 1) {
            setError("Polling timeout");
            setLoading(false);
          }
        }
      }
    },
    [signature]
  );

  useEffect(() => {
    if (signature) {
      pollStatus();
    }
  }, [signature, pollStatus]);

  return { status, loading, error, refetch: pollStatus };
};
```

### Error Handling Utility

```javascript
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", {
      url,
      error: error.message,
      options,
    });
    throw error;
  }
};

// Usage with retry logic
const apiCallWithRetry = async (url, options = {}, maxRetries = 3) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall(url, options);
    } catch (error) {
      if (i === maxRetries) throw error;

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
```

---

## 🔧 Best Practices

1. **Pagination**: Always implement pagination for large datasets. Use appropriate page sizes (10-100 items).

2. **Caching**: The API implements server-side caching. Consider client-side caching for frequently accessed data.

3. **Error Handling**: Always implement proper error handling with retry logic for network requests.

4. **Rate Limiting**: While no explicit limits exist, be mindful of making too many concurrent requests.

5. **Batch Requests**: Use batch endpoints when possible to reduce the number of API calls.

6. **Polling**: For transaction status, implement exponential backoff to avoid overwhelming the server.

7. **Data Validation**: Always validate public keys and signatures before making API calls.

8. **Cursor Management**: Store pagination cursors/offsets for better user experience.

9. **Loading States**: Always show loading indicators during API calls.

10. **Error Recovery**: Implement retry mechanisms and graceful error handling.

---

## 📊 Swagger Documentation

The API also provides interactive Swagger documentation at:

```
/api-docs
```

This includes detailed schema definitions and a testing interface for all endpoints.

---

## 🚀 Quick Start Examples

### Basic Account Info

```javascript
// Get account balance and info
const accountInfo = await fetch(
  "/api/account/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/info"
).then((res) => res.json());

const balance = await fetch(
  "/api/balance/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
).then((res) => res.json());
```

### Transaction Lookup

```javascript
// Get transaction details
const tx = await fetch("/api/tx/5j7s1QzqC5QjB8TxWx5D...").then((res) =>
  res.json()
);

// Check transaction status
const status = await fetch("/api/tx/5j7s1QzqC5QjB8TxWx5D.../status").then(
  (res) => res.json()
);
```

### Token Information

```javascript
// Get token supply
const supply = await fetch(
  "/api/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/supply"
).then((res) => res.json());

// Get token holders
const holders = await fetch(
  "/api/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/holders?limit=100"
).then((res) => res.json());
```

---

## 🆘 Support

For issues or questions about the API:

1. Check the error message and status code
2. Verify your parameters are correctly formatted
3. Check the Swagger documentation for detailed schemas
4. Review the frontend integration examples above
5. Ensure you're handling pagination correctly
6. Implement proper error handling and retry logic

---

_Last updated: December 2024_
