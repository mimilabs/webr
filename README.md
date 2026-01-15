# WebR API Server

A standalone Next.js API server for executing R code using WebR (R in WebAssembly) on AWS EC2 Ubuntu.

## Overview

This server provides a REST API to execute R code in a sandboxed WebAssembly environment with pre-installed data analysis packages. It's designed for production deployment on AWS EC2 with PM2 process management.

## Features

- **WebR Integration**: Run R code in WebAssembly (no R installation required)
- **Pre-installed Packages**: ggplot2, dplyr, tidyr, survey, srvyr, broom
- **Plot Generation**: Automatic PNG generation and base64 encoding
- **Data Injection**: Pass SQL results as R data frames
- **Warm Instance**: WebR stays loaded for fast execution
- **Production Ready**: PM2 configuration with auto-restart
- **CORS Enabled**: Configured for mimilabs.ai domains
- **Health Checks**: Monitor server and WebR status

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The server will start on http://localhost:3000

Note: First startup takes 2-5 minutes to initialize WebR and install R packages.

### Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete AWS EC2 Ubuntu setup instructions.

Quick production start:

```bash
# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status
```

## API Documentation

See [API.md](./API.md) for complete API reference.

### Endpoints

#### POST /api/execute

Execute R code and return results including plots.

**Request:**
```json
{
  "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()",
  "data": [{"id": 1, "value": 10}]
}
```

**Response:**
```json
{
  "success": true,
  "output": "[1] 2\n",
  "plots": ["base64-encoded-png"],
  "error": null,
  "executionTime": 1234
}
```

#### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "webrInitialized": true,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.456
}
```

## Example Usage

```bash
# Health check
curl http://localhost:3000/api/health

# Execute R code
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1 + 1)"}'

# With ggplot2
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"}'

# With data injection
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(dplyr)\nquery_result %>% summarise(mean_value = mean(value))",
    "data": [{"id": 1, "value": 10}, {"id": 2, "value": 20}]
  }'
```

## Project Structure

```
webr/
├── app/
│   ├── api/
│   │   ├── execute/
│   │   │   └── route.ts      # Main R execution endpoint
│   │   └── health/
│   │       └── route.ts      # Health check endpoint
│   └── ...
├── lib/
│   └── webr-singleton.ts     # WebR instance management
├── ecosystem.config.js       # PM2 configuration
├── API.md                    # API documentation
├── DEPLOYMENT.md             # Deployment guide
└── package.json
```

## Pre-installed R Packages

- **ggplot2**: Data visualization
- **dplyr**: Data manipulation
- **tidyr**: Data tidying
- **survey**: Survey statistics
- **srvyr**: dplyr-style survey analysis
- **broom**: Tidy model outputs

Packages are installed from https://repo.r-wasm.org/ on first startup.

## Requirements

### Development
- Node.js 20+
- npm or yarn

### Production (AWS EC2)
- Ubuntu 20.04/22.04/24.04
- Node.js 20
- PM2
- 4GB+ RAM recommended (t3.medium or larger)
- nginx (optional, for reverse proxy)

## Configuration

### CORS

Edit `app/api/execute/route.ts` and `app/api/health/route.ts` to modify allowed origins:

```typescript
const allowedOrigins = [
  'https://www.mimilabs.ai',
  'https://mimilabs.ai'
];
```

### Port

Default port is 3000. Change in `package.json`:

```json
"start": "next start -p 3000"
```

Or in `ecosystem.config.js` for PM2:

```javascript
env: {
  PORT: 3000
}
```

## Performance

- **First Request**: 2-5 minutes (WebR initialization + package installation)
- **Subsequent Requests**: 100-500ms (depending on code complexity)
- **WebR Instance**: Stays warm in memory
- **Packages**: Remain loaded after initialization

**Recommendation**: Make a warmup request after deployment.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- AWS EC2 Ubuntu setup instructions
- Node.js 20 installation
- PM2 configuration and monitoring
- nginx reverse proxy setup (optional)
- SSL with Let's Encrypt
- Troubleshooting guide

## Documentation

- **[API.md](./API.md)**: Complete API reference with examples
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: AWS EC2 deployment guide
- **[WebR Docs](https://docs.r-wasm.org/webr/latest/)**: WebR documentation
- **[Next.js Docs](https://nextjs.org/docs)**: Next.js documentation

## License

This project is for use with mimilabs.ai services.
