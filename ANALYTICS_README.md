# 📊 Gorbchain Indexer Analytics API

A comprehensive analytics API for Solana blockchain data, providing real-time metrics, historical trends, and network insights similar to Dune Analytics.

## 🚀 Quick Start

Base URL: `http://localhost:3000/api/analytics`

All endpoints return JSON responses with real-time data from the Solana network and indexed blockchain data.

## 📈 Available Endpoints

### 1. Overview Analytics

Get key blockchain metrics at a glance.

**Endpoint:** `GET /analytics/overview`

**Response:**

```json
{
  "totalTransactions": 13563508,
  "totalWallets": 50000,
  "totalTokenVolume": "1000000000",
  "activeWalletsToday": 1356,
  "transactionsToday": 150000,
  "currentSlot": 377244,
  "tokenCount": 1250,
  "networkHealth": {
    "tps": 2.47,
    "successRate": 0.98,
    "blockTime": 400,
    "epoch": 46,
    "epochProgress": 5.03
  },
  "supply": {
    "total": 501181832777852900,
    "circulating": 184817524422110340,
    "nonCirculating": 316364308355742600
  },
  "metadata": {
    "dataSource": "mixed",
    "estimatedValues": ["activeWalletsToday"],
    "lastUpdated": "2025-06-21T16:16:50.847Z",
    "rpcStatus": "connected"
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/analytics/overview" \
  -H "Accept: application/json"
```

---

### 2. Transaction Timeseries

Historical transaction data with success/failure rates.

**Endpoint:** `GET /analytics/transactions/timeseries`

**Parameters:**

- `period` (optional): `hour`, `day`, `week`, `month`, `year` (default: `day`)
- `from` (optional): Start date in YYYY-MM-DD format
- `to` (optional): End date in YYYY-MM-DD format
- `limit` (optional): Max data points (1-100, default: 30)

**Response:**

```json
{
  "data": [
    {
      "timestamp": "2025-06-21T00:00:00.000Z",
      "total": 52571,
      "successful": 51519,
      "failed": 1052,
      "successRate": 0.98
    }
  ],
  "metadata": {
    "period": "day",
    "from": "2025-06-14T00:00:00.000Z",
    "to": "2025-06-21T23:59:59.999Z",
    "totalDataPoints": 1,
    "dataSource": "database"
  }
}
```

**cURL Examples:**

```bash
# Daily transactions for last 7 days
curl -X GET "http://localhost:3000/api/analytics/transactions/timeseries?period=day&limit=7"

# Hourly transactions for specific date range
curl -X GET "http://localhost:3000/api/analytics/transactions/timeseries?period=hour&from=2025-06-20&to=2025-06-21"
```

---

### 3. Users Timeseries

Active user metrics over time.

**Endpoint:** `GET /analytics/users/timeseries`

**Parameters:**

- `period` (optional): `hour`, `day`, `week`, `month`, `year` (default: `day`)
- `from` (optional): Start date in YYYY-MM-DD format
- `to` (optional): End date in YYYY-MM-DD format

**Response:**

```json
{
  "data": [
    {
      "timestamp": "2025-06-21T00:00:00.000Z",
      "activeUsers": 5420,
      "newUsers": 542
    }
  ],
  "metadata": {
    "period": "day",
    "from": "2025-06-14T00:00:00.000Z",
    "to": "2025-06-21T23:59:59.999Z",
    "dataSource": "database"
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/analytics/users/timeseries?period=day&from=2025-06-15&to=2025-06-21"
```

---

### 4. Token Volume Analytics

Token supply and volume data.

**Endpoint:** `GET /analytics/tokens/volume`

**Parameters:**

- `limit` (optional): Number of top tokens to return (1-100, default: 10)
- `days` (optional): Time period in days (default: 30)

**Response:**

```json
{
  "tokens": [
    {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "volume": "1000000000",
      "decimals": 6,
      "lastUpdated": "2025-06-21T16:00:00.000Z"
    }
  ],
  "totalVolume": "50000000000",
  "metadata": {
    "period": "30 days",
    "totalTokens": 1,
    "dataSource": "database",
    "lastUpdated": "2025-06-21T16:16:50.847Z"
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/analytics/tokens/volume?limit=5&days=7"
```

---

### 5. Network Health

Real-time network performance metrics.

**Endpoint:** `GET /analytics/network/health`

**Response:**

```json
{
  "currentSlot": 377244,
  "tps": 2.47,
  "epochInfo": {
    "epoch": 46,
    "slotIndex": 21739,
    "slotsInEpoch": 432000,
    "progress": 5.03
  },
  "supply": {
    "total": 501181832777852900,
    "circulating": 184817524422110340,
    "nonCirculating": 316364308355742600
  },
  "performance": {
    "avgBlockTime": 400,
    "successRate": 0.98,
    "networkLoad": 0.0005
  },
  "metadata": {
    "dataSource": "rpc",
    "lastUpdated": "2025-06-21T16:16:50.847Z",
    "rpcStatus": "connected"
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/analytics/network/health"
```

---

### 6. Top Programs

Most active programs by transaction count.

**Endpoint:** `GET /analytics/programs/top`

**Parameters:**

- `limit` (optional): Number of programs to return (1-100, default: 10)
- `period` (optional): `day`, `week`, `month`, `all` (default: `week`)

**Response:**

```json
{
  "data": [
    {
      "programId": "3CRM2dM7",
      "transactionCount": 15420,
      "successRate": "98.0"
    }
  ],
  "metadata": {
    "period": "week",
    "limit": 10,
    "lastUpdated": "2025-06-21T16:16:50.847Z",
    "note": "Program IDs are approximated using transaction signature prefixes"
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/analytics/programs/top?limit=5&period=day"
```

## 🔧 Frontend Integration

### React Hook Example

```javascript
import { useState, useEffect } from "react";

const useAnalytics = (endpoint, params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(params).toString();
        const url = `http://localhost:3000/api/analytics/${endpoint}${
          queryParams ? `?${queryParams}` : ""
        }`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch analytics data");

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
};

// Usage in component
const AnalyticsDashboard = () => {
  const { data: overview, loading } = useAnalytics("overview");
  const { data: transactions } = useAnalytics("transactions/timeseries", {
    period: "day",
    limit: 7,
  });

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div>
      <h2>Total Transactions: {overview?.totalTransactions}</h2>
      <h2>Current TPS: {overview?.networkHealth?.tps}</h2>
      {/* Render charts with transactions data */}
    </div>
  );
};
```

### Chart.js Integration

```javascript
import { Line } from "react-chartjs-2";

const TransactionChart = ({ timeseriesData }) => {
  const chartData = {
    labels:
      timeseriesData?.data?.map((item) =>
        new Date(item.timestamp).toLocaleDateString()
      ) || [],
    datasets: [
      {
        label: "Total Transactions",
        data: timeseriesData?.data?.map((item) => item.total) || [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
      {
        label: "Successful Transactions",
        data: timeseriesData?.data?.map((item) => item.successful) || [],
        borderColor: "rgb(54, 162, 235)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Transaction History" },
    },
  };

  return <Line data={chartData} options={options} />;
};
```

## 📊 Data Sources

| Endpoint       | Data Source           | Update Frequency |
| -------------- | --------------------- | ---------------- |
| Overview       | Solana RPC + Database | Real-time        |
| Transactions   | Database              | As indexed       |
| Users          | Database              | As indexed       |
| Tokens         | Database              | As indexed       |
| Network Health | Solana RPC            | Real-time        |
| Programs       | Database              | As indexed       |

## ⚡ Performance Notes

- **Caching**: Responses are not cached - all data is real-time
- **Rate Limits**: No rate limits currently implemented
- **Pagination**: Use `limit` parameter to control response size
- **Time Ranges**: Larger time ranges may take longer to process

## 🚨 Error Handling

All endpoints return proper HTTP status codes and error messages:

**Success Response (200):**

```json
{
  "data": [...],
  "metadata": {...}
}
```

**Error Response (500):**

```json
{
  "status": "error",
  "message": "Internal server error",
  "details": "Specific error description"
}
```

**Common Error Scenarios:**

- **RPC Connection Failed**: Network health endpoint may fail if Solana RPC is unreachable
- **Database Query Failed**: Timeseries endpoints may fail if database is unavailable
- **Invalid Parameters**: Returns 400 with validation error message

## 🔍 Monitoring & Debugging

### Health Check

```bash
# Check if analytics API is responding
curl -X GET "http://localhost:3000/api/analytics/overview" -I
```

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages in API responses.

### Logs

All endpoints log errors to console with full stack traces for debugging.

## 🚀 Production Deployment

### Environment Variables

```bash
# Required for Solana RPC connection
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_WS_URL=wss://api.mainnet-beta.solana.com

# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/solana_indexer
```

### Performance Recommendations

1. **Database Indexing**: Ensure proper indexes on `last_updated` columns
2. **Connection Pooling**: Use connection pooling for database queries
3. **Caching**: Consider implementing Redis caching for frequently accessed data
4. **Load Balancing**: Use load balancer for high-traffic scenarios

## 📝 API Documentation

Interactive API documentation is available via Swagger UI when the server is running:

- **URL**: `http://localhost:3000/api-docs`
- **Filter**: Search for "Analytics" tag to see all analytics endpoints

## 🤝 Contributing

When adding new analytics endpoints:

1. Follow the existing response format with `data` and `metadata` fields
2. Include proper error handling with meaningful error messages
3. Add Swagger documentation comments
4. Update this README with the new endpoint
5. Avoid fallback/fake data - return real errors when data is unavailable

## 📄 License

This analytics API is part of the Solana Indexer project.
