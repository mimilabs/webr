# WebR API Server - Setup Complete ✅

## Server Status: LIVE 🟢

**Endpoint**: https://webr.mimilabs.org

## Authentication

**API Key** (share with authorized users only):
```
webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525
```

## Endpoints

### 1. Health Check (PUBLIC - No Auth Required)
```bash
curl https://webr.mimilabs.org/api/health
```

**Response:**
```json
{
  "status": "ok",
  "webrInitialized": true,
  "timestamp": "2024-01-15T20:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Execute R Code (PROTECTED - Auth Required)
```bash
curl -X POST https://webr.mimilabs.org/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525" \
  -d '{"code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"}'
```

**Response:**
```json
{
  "success": true,
  "output": "...",
  "plots": ["base64-encoded-png"],
  "error": null,
  "executionTime": 1234
}
```

## Server Configuration

- **Runtime**: Node.js 24.13.0
- **Framework**: Next.js 16.1.2
- **Process Manager**: PM2
- **Port**: 3000 (internal)
- **Public Access**: Via AWS Application Load Balancer (HTTPS)
- **Auto-restart**: Enabled (PM2 will restart on crash)
- **Auto-start on boot**: Enabled (systemd service)

## Pre-installed R Packages

- ggplot2 (visualization)
- dplyr (data manipulation)
- tidyr (data tidying)
- survey (survey statistics)
- srvyr (tidyverse-style survey)
- broom (tidy model outputs)

## PM2 Management Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs webr-api

# Restart
pm2 restart webr-api

# Stop
pm2 stop webr-api

# Monitor
pm2 monit
```

## Performance

- **First request after restart**: 2-5 minutes (WebR initialization)
- **Subsequent requests**: 100-500ms
- **Timeout**: 60 seconds max
- **Memory**: ~800MB after initialization

## Documentation for Teams

Share these files with developers:

1. **API_KEY.txt** - Authentication credentials
2. **QUICK_START.md** - One-page quick reference
3. **AUTH.md** - Authentication guide
4. **INTEGRATION.md** - Complete integration examples
5. **examples/snippets.js** - JavaScript/TypeScript code examples
6. **examples/snippets.py** - Python code examples

## Testing

Run the test script:
```bash
cd /home/ubuntu/webr
bash test-api.sh
```

Or manual tests:
```bash
# Health check (no auth)
curl https://webr.mimilabs.org/api/health

# Execute with auth
curl -X POST https://webr.mimilabs.org/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525" \
  -d '{"code": "print(1 + 1)"}'
```

## Security

- ✅ API key authentication on execute endpoint
- ✅ CORS configured for mimilabs.ai domains
- ✅ Health endpoint public (for monitoring)
- ✅ API key stored in environment variable
- ✅ API key gitignored
- ✅ SSL via AWS Load Balancer

## Backup & Recovery

**Configuration files location:**
```
/home/ubuntu/webr/.env.local          # API key
/home/ubuntu/webr/ecosystem.config.js # PM2 config
```

**To regenerate API key:**
```bash
node -e "console.log('webr_' + require('crypto').randomBytes(32).toString('hex'))"
# Update .env.local
# Rebuild: npm run build
# Restart: pm2 restart webr-api
```

## Troubleshooting

### Server not responding
```bash
pm2 restart webr-api
pm2 logs webr-api
```

### WebR not initialized
Wait 2-5 minutes after restart. Check logs:
```bash
pm2 logs webr-api | grep WebR
```

### 502 Bad Gateway
Server is down. Check PM2:
```bash
pm2 status
pm2 restart webr-api
```

### Out of memory
```bash
# Check memory usage
pm2 monit

# Increase EC2 instance size if needed
```

## Maintenance

**Update code:**
```bash
cd /home/ubuntu/webr
git pull  # if using git
npm install
npm run build
pm2 restart webr-api
```

**View logs:**
```bash
pm2 logs webr-api
# or
tail -f /home/ubuntu/webr/logs/output.log
tail -f /home/ubuntu/webr/logs/error.log
```

**Monitor resources:**
```bash
pm2 monit
```

## Support

- **API issues**: Check PM2 logs
- **Authentication**: See AUTH.md
- **Integration help**: See INTEGRATION.md
- **Server admin**: Check DEPLOYMENT.md

## Next Steps

1. ✅ Server is running under PM2
2. ✅ Auto-restarts on crash
3. ✅ Auto-starts on server reboot
4. ✅ Authentication enabled
5. ✅ Documentation ready
6. 📤 Share API_KEY.txt with your team
7. 📤 Share QUICK_START.md and AUTH.md

---

**Server is production-ready! 🚀**

Last updated: 2024-01-15
