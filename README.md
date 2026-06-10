# Bike Shop Podium — Micro-Frontend Application

A micro-frontend application built with [Podium](https://podium-lib.io/) that composes independent page fragments (podlets) into a unified layout. This project serves as the frontend layer for the bike shop microservices backend, replicating the exact same UI as the Module Federation implementation for comparison testing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (:8000)                           │
│                    Layout Server                             │
│           /  → Shopping View (bikes + cart)                  │
│      /checkout → Checkout + Order History                    │
└───────┬──────────────────┬──────────────────┬───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Bike Podlet  │   │ Cart Podlet  │   │ Order Podlet │
│   (:7101)    │   │   (:7102)    │   │   (:7103)    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Bike Service │   │ Cart Service │   │ Order Service│
│   (:8081)    │   │   (:8082)    │   │   (:8083)    │
└──────────────┘   └──────────────┘   └──────────────┘
          (Microservices - separate Docker Compose)
```

### Routes

| Route | View | Podlets Used |
|-------|------|--------------|
| `/` | Shopping view — bikes + cart side by side | bike-podlet, cart-podlet |
| `/checkout` | Checkout form + cart summary + order history | order-podlet |

### Services

| Service | Port | Description |
|---------|------|-------------|
| Layout | 8000 | Routes requests and composes podlets into pages |
| Bike Podlet | 7101 | Bike catalog with search and add-to-cart |
| Cart Podlet | 7102 | Shopping cart with quantity controls |
| Order Podlet | 7103 | Checkout form, cart summary, order history |

## Prerequisites

- **Docker** and **Docker Compose** installed
- The **microservices backend** running (from `software-engineering` project)

## Getting Started

### Step 1: Start the Microservices Backend

First, ensure the backend microservices are running:

```bash
cd /path/to/software-engineering
docker compose up -d
```

Wait for all services to be healthy:

```bash
docker compose ps
```

You should see `bike-service`, `cart-service`, `order-service`, `kafka`, `redis`, and the PostgreSQL databases all running and healthy.

### Step 2: Start the Podium Frontend

From this project's root directory:

```bash
docker compose up --build
```

This will:
1. Build Docker images for each podlet and the layout
2. Connect to the microservices network (`software-engineering_default`)
3. Start all Podium services

### Step 3: Access the Application

Open your browser and navigate to:

- **Shopping page:** http://localhost:8000
- **Checkout page:** http://localhost:8000/checkout

## Running for Development (Without Docker)

If you want to run the services locally for development:

```bash
# Terminal 1 - Bike Podlet
cd bike-podlet
npm install
BIKE_SERVICE_URL=http://localhost:8081 BIKE_SERVICE_URL_CLIENT=http://localhost:8081 CART_SERVICE_URL_CLIENT=http://localhost:8082 node index.mjs

# Terminal 2 - Cart Podlet
cd cart-podlet
npm install
CART_SERVICE_URL=http://localhost:8082 CART_SERVICE_URL_CLIENT=http://localhost:8082 BIKE_SERVICE_URL_CLIENT=http://localhost:8081 node index.mjs

# Terminal 3 - Order Podlet
cd order-podlet
npm install
ORDER_SERVICE_URL=http://localhost:8083 CART_SERVICE_URL=http://localhost:8082 ORDER_SERVICE_URL_CLIENT=http://localhost:8083 CART_SERVICE_URL_CLIENT=http://localhost:8082 node index.mjs

# Terminal 4 - Layout
cd layout
npm install
node server.mjs
```

> **Note:** The microservices backend must still be running (either via Docker or locally).

## Environment Variables

### Bike Podlet
| Variable | Default | Description |
|----------|---------|-------------|
| `BIKE_SERVICE_URL` | `http://localhost:8081` | Bike service API URL (server-side) |
| `BIKE_SERVICE_URL_CLIENT` | `http://localhost:8081` | Bike service URL for browser (images) |
| `CART_SERVICE_URL_CLIENT` | `http://localhost:8082` | Cart service URL for browser requests |

### Cart Podlet
| Variable | Default | Description |
|----------|---------|-------------|
| `CART_SERVICE_URL` | `http://localhost:8082` | Cart service API URL (server-side) |
| `CART_SERVICE_URL_CLIENT` | `http://localhost:8082` | Cart service URL for browser requests |
| `BIKE_SERVICE_URL_CLIENT` | `http://localhost:8081` | Bike service URL for browser (images) |

### Order Podlet
| Variable | Default | Description |
|----------|---------|-------------|
| `ORDER_SERVICE_URL` | `http://localhost:8083` | Order service API URL (server-side) |
| `CART_SERVICE_URL` | `http://localhost:8082` | Cart service API URL (server-side) |
| `ORDER_SERVICE_URL_CLIENT` | `http://localhost:8083` | Order service URL for browser |
| `CART_SERVICE_URL_CLIENT` | `http://localhost:8082` | Cart service URL for browser |

### Layout
| Variable | Default | Description |
|----------|---------|-------------|
| `BIKE_PODLET_URL` | `http://localhost:7101` | Bike podlet base URL |
| `CART_PODLET_URL` | `http://localhost:7102` | Cart podlet base URL |
| `ORDER_PODLET_URL` | `http://localhost:7103` | Order podlet base URL |

## Docker Networking

The `docker-compose.yml` uses two networks:

- **`podium-net`**: Internal network for communication between podlets and layout
- **`microservices-net`** (external: `software-engineering_default`): Connects podlets to the backend microservices

This allows:
- Server-side code in podlets to reach microservices via internal Docker hostnames (e.g., `bike-service:8081`)
- The browser to reach microservices via `localhost` mapped ports (e.g., `localhost:8082`)

## Troubleshooting

### "Network software-engineering_default not found"

The microservices Docker Compose must be running first to create the shared network:

```bash
cd /path/to/software-engineering
docker compose up -d
```

### Podlets return empty content

Check if the microservices are healthy:

```bash
curl http://localhost:8081/bikes
curl http://localhost:8082/cart
curl http://localhost:8083/order/history
```

### Layout shows "podlet could not be fetched"

Ensure podlets are running and accessible:

```bash
curl http://localhost:7101/manifest.json
curl http://localhost:7102/manifest.json
curl http://localhost:7103/manifest.json
```

### Rebuild after code changes

```bash
docker compose up --build
```

## Stopping the Application

```bash
# Stop Podium frontend
docker compose down

# Stop microservices backend (in the software-engineering directory)
cd /path/to/software-engineering
docker compose down
```

## Technology Stack

- **[Podium](https://podium-lib.io/)** — Micro-frontend framework for runtime composition
- **Express.js** — HTTP server for layout and podlets
- **Node.js 20** — Runtime environment
- **Docker** — Containerization
