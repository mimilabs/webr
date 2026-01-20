# WebR Charting Server

**A minimal WebR API server designed for generating R charts in LLM operations.**

This server provides a simple REST API to execute R code and generate charts using WebR (R in WebAssembly). Perfect for integrating statistical visualizations and data analysis into AI workflows.

## Features

- **WebR Runtime**: Execute R code in WebAssembly (no R installation required)
- **Pre-installed Packages**: ggplot2, dplyr, tidyr, survey, srvyr, broom
- **Automatic Plot Capture**: PNG generation with base64 encoding
- **Data Injection**: Pass JSON data as R data frames
- **Warm Instance**: WebR stays loaded for fast execution (100-500ms after warmup)
- **API Key Authentication**: Secure access control
- **Health Monitoring**: Track server and WebR status

## Quick Start

### Installation

```bash
# Clone repository
git clone <repository-url>
cd webr

# Install dependencies
npm install

# Set up authentication
echo "API_KEY=your-secret-key-here" > .env.local

# Start development server
npm run dev
```

Server starts on http://localhost:3000

**Note**: First startup takes 2-5 minutes to initialize WebR and install R packages.

### Production Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 status
pm2 logs webr-api
```

## API Reference

### Authentication

All API requests (except `/api/health`) require an API key:

```bash
# Bearer token format
Authorization: Bearer your-api-key

# Or plain format
Authorization: your-api-key
```

### POST /api/execute

Execute R code and return results with plots.

**Request:**
```json
{
  "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()",
  "data": [{"id": 1, "value": 10}]
}
```

**Parameters:**
- `code` (string, required): R code to execute
- `data` (array, optional): JSON data injected as R data frame named `query_result`

**Response:**
```json
{
  "success": true,
  "output": "[1] 2\n",
  "plots": ["base64-encoded-png..."],
  "error": null,
  "executionTime": 234
}
```

**Response Fields:**
- `success` (boolean): Execution status
- `output` (string): R console output
- `plots` (array): Base64-encoded PNG images
- `error` (string|null): Error message if failed
- `executionTime` (number): Execution time in milliseconds

### GET /api/health

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "webrInitialized": true,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.456
}
```

## Usage Examples

### cURL

```bash
# Simple R execution
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"code": "print(1 + 1)"}'

# Generate ggplot2 chart
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point() + theme_minimal()"
  }'

# Analyze JSON data
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "code": "library(dplyr)\nquery_result %>% summarise(mean_value = mean(value))",
    "data": [{"id": 1, "value": 10}, {"id": 2, "value": 20}]
  }'
```

### JavaScript/TypeScript

```javascript
async function executeR(code, data = null) {
  const response = await fetch('http://localhost:3000/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({ code, data })
  });
  return await response.json();
}

// Usage
const result = await executeR(`
  library(ggplot2)
  ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
`);

// Display plots
result.plots.forEach((plot, i) => {
  const img = document.createElement('img');
  img.src = `data:image/png;base64,${plot}`;
  document.body.appendChild(img);
});
```

### React Hook

```javascript
import { useState, useCallback } from 'react';

function useWebR() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (code, data = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer your-api-key'
        },
        body: JSON.stringify({ code, data })
      });

      const result = await response.json();
      if (result.success) {
        setResult(result);
      } else {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, execute };
}

// Component usage
function ChartComponent() {
  const { result, loading, execute } = useWebR();

  return (
    <div>
      <button onClick={() => execute('ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()')} disabled={loading}>
        Generate Chart
      </button>
      {result?.plots.map((plot, i) => (
        <img key={i} src={`data:image/png;base64,${plot}`} alt={`Plot ${i}`} />
      ))}
    </div>
  );
}
```

### Python

```python
import requests
import base64
from PIL import Image
from io import BytesIO

def execute_r(code, data=None):
    """Execute R code on WebR server."""
    url = "http://localhost:3000/api/execute"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-api-key"
    }
    payload = {"code": code}
    if data:
        payload["data"] = data

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
result = execute_r("""
library(ggplot2)
ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
""")

# Save plots
for i, base64_plot in enumerate(result["plots"]):
    plot_data = base64.b64decode(base64_plot)
    img = Image.open(BytesIO(plot_data))
    img.save(f"plot_{i+1}.png")
    print(f"Saved plot_{i+1}.png")
```

## Pre-installed R Packages

| Package | Purpose |
|---------|---------|
| ggplot2 | Data visualization |
| dplyr | Data manipulation |
| tidyr | Data tidying |
| survey | Survey statistics |
| srvyr | dplyr-style survey analysis |
| broom | Tidy model outputs |

Packages are installed from https://repo.r-wasm.org/ on first startup.

## Data Injection

When you provide a `data` parameter, it's automatically converted to an R data frame named `query_result`:

```json
{
  "code": "library(dplyr)\nquery_result %>% filter(value > 15)",
  "data": [
    {"id": 1, "value": 10},
    {"id": 2, "value": 20},
    {"id": 3, "value": 30}
  ]
}
```

The `query_result` data frame will be available in your R code with correct column types.

## Plot Handling

### Automatic Capture

All plots are automatically captured and returned as base64-encoded PNG images (800x600 pixels).

### Multiple Plots

Multiple plots are captured and returned in order:

```r
library(ggplot2)

# Plot 1
ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()

# Plot 2
ggplot(mtcars, aes(x=hp, y=mpg)) + geom_point()
```

Both plots appear in the `plots` array.

### Custom Plot Size

Use `ggsave()` for custom dimensions:

```r
library(ggplot2)

p <- ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
ggsave("/tmp/plot.png", p, width=10, height=6, dpi=150)
```

## Configuration

### Environment Variables

Create `.env.local`:

```bash
# Required: API key for authentication
API_KEY=your-secret-key-here

# Optional: Server port (default: 3000)
PORT=3000
```

### CORS Settings

Edit `app/api/execute/route.ts` to modify allowed origins:

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'http://localhost:3000'
];
```

## Deployment

### Requirements

- **Server**: Ubuntu 20.04/22.04/24.04
- **Instance**: 4GB+ RAM (AWS t3.medium or larger)
- **Node.js**: Version 20+
- **PM2**: Process manager

### AWS EC2 Setup

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Clone and setup
git clone <repository-url>
cd webr
npm install
npm run build

# 4. Configure environment
echo "API_KEY=$(openssl rand -hex 32)" > .env.local

# 5. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Performance

| Metric | Value |
|--------|-------|
| First request | 2-5 minutes (WebR initialization) |
| Subsequent requests | 100-500ms |
| WebR instance | Stays warm in memory |
| Packages | Remain loaded |

**Recommendation**: Make a warmup request after deployment:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"code": "library(ggplot2)\nprint(\"ready\")"}'
```

## Project Structure

```
webr/
├── app/
│   └── api/
│       ├── execute/route.ts    # Main R execution endpoint
│       └── health/route.ts     # Health check endpoint
├── lib/
│   ├── webr-singleton.ts       # WebR instance management
│   └── auth.ts                 # API key authentication
├── ecosystem.config.js         # PM2 configuration
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## Troubleshooting

### WebR Not Initialized

If `webrInitialized` is false:
- Server is still initializing (wait 2-5 minutes)
- Check logs: `pm2 logs webr-api`
- Verify memory: `free -h` (need 4GB+)

### Plots Not Returning

- Ensure ggplot2 is loaded: `library(ggplot2)`
- Check output for R errors
- Verify `/tmp` is writable: `ls -la /tmp`

### Memory Issues

- Increase EC2 instance size
- Add swap space: `sudo fallocate -l 4G /swapfile`
- Simplify R code or reduce data size

### Authentication Errors

- Verify API_KEY is set in `.env.local`
- Check Authorization header format
- Ensure server was restarted after changing `.env.local`

## Security

- **Sandboxing**: WebR runs in WebAssembly (isolated from host)
- **No Network Access**: R code cannot make external requests
- **File System**: Limited to `/tmp` directory only
- **API Key**: Required for all execution endpoints
- **CORS**: Configure allowed origins in production

## Limitations

1. **Execution timeout**: 60 seconds default (configurable)
2. **Memory**: Limited by instance size (4GB+ recommended)
3. **File system**: Only `/tmp` is writable
4. **Packages**: Only pre-installed packages available
5. **Parallelization**: Single R process per request

## License

For use with authorized services.
