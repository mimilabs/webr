# WebR API Server - AWS EC2 Ubuntu Deployment Guide

This guide covers deploying the WebR API server on AWS EC2 Ubuntu.

## Prerequisites

- AWS EC2 Ubuntu instance (t3.medium or larger recommended)
- SSH access to the instance
- Domain name (optional, for nginx setup)

## Initial Server Setup

### 1. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20

```bash
# Install Node.js 20 using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 3. Install PM2 Globally

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 4. Configure Firewall (if using UFW)

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3000/tcp    # Node.js app
sudo ufw allow 80/tcp      # HTTP (if using nginx)
sudo ufw allow 443/tcp     # HTTPS (if using nginx)
sudo ufw enable
```

## Application Deployment

### 1. Clone or Upload Your Application

```bash
# If using git
cd /home/ubuntu
git clone <your-repo-url> webr
cd webr

# Or upload files via SCP/SFTP to /home/ubuntu/webr
```

### 2. Install Dependencies

```bash
cd /home/ubuntu/webr
npm install
```

### 3. Build the Application

```bash
npm run build
```

This will create an optimized production build. The first time the application starts, it will initialize WebR and install all required R packages (ggplot2, dplyr, tidyr, survey, srvyr, broom).

### 4. Create Logs Directory

```bash
mkdir -p /home/ubuntu/webr/logs
```

### 5. Start with PM2

```bash
pm2 start ecosystem.config.js
```

### 6. Verify Application is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs webr-api

# Test health endpoint
curl http://localhost:3000/api/health
```

### 7. Configure PM2 to Start on Boot

```bash
# Generate startup script
pm2 startup

# Run the command that PM2 outputs (it will be specific to your system)
# Then save the current PM2 process list
pm2 save
```

## Testing the API

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "webrInitialized": true,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.456
}
```

### Execute R Code

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(ggplot2)\nprint(1 + 1)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"
  }'
```

Expected response:
```json
{
  "success": true,
  "output": "[1] 2\n",
  "plots": ["<base64-encoded-png>"],
  "error": null,
  "executionTime": 1234
}
```

### Execute with Data Injection

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(dplyr)\nquery_result %>% summarise(mean_value = mean(value))",
    "data": [
      {"id": 1, "value": 10},
      {"id": 2, "value": 20},
      {"id": 3, "value": 30}
    ]
  }'
```

## PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs webr-api

# View real-time logs
pm2 logs webr-api --lines 100

# Restart application
pm2 restart webr-api

# Stop application
pm2 stop webr-api

# Delete from PM2
pm2 delete webr-api

# Monitor
pm2 monit
```

## Optional: Nginx Reverse Proxy Setup

If you want to use nginx as a reverse proxy (recommended for production):

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/webr-api
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for long-running R operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

### 3. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/webr-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Optional: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Maintenance

### View Application Logs

```bash
# PM2 logs
pm2 logs webr-api

# Application output
tail -f /home/ubuntu/webr/logs/output.log

# Application errors
tail -f /home/ubuntu/webr/logs/error.log
```

### Monitor System Resources

```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit
```

### Updating the Application

```bash
cd /home/ubuntu/webr

# Pull latest changes (if using git)
git pull

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart webr-api
```

## Troubleshooting

### WebR Initialization Taking Long

The first startup may take 2-5 minutes as WebR downloads and installs all R packages. Check the logs:

```bash
pm2 logs webr-api
```

You should see messages like:
```
[WebR] Initializing WebR instance...
[WebR] Installing package: ggplot2
[WebR] Package ggplot2 installed successfully
...
```

### Out of Memory Errors

If you encounter memory issues:

1. Increase EC2 instance size (t3.medium minimum recommended)
2. Add swap space:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find what's using the port
sudo lsof -i :3000

# Kill the process or change the port in ecosystem.config.js
```

### Application Crashes on Startup

Check the error logs:

```bash
pm2 logs webr-api --err
```

Common issues:
- Missing dependencies: Run `npm install`
- Build not created: Run `npm run build`
- Permissions issues: Check file ownership

## Security Recommendations

1. **Update CORS origins**: Edit `app/api/execute/route.ts` and `app/api/health/route.ts` to restrict CORS to your specific domains only.

2. **Use environment variables**: Store sensitive configuration in environment variables:
   ```bash
   # Create .env.production file
   echo "NODE_ENV=production" > .env.production
   ```

3. **Enable firewall**: Use UFW to restrict access to only necessary ports.

4. **Regular updates**: Keep system packages and Node.js dependencies up to date.

5. **Rate limiting**: Consider adding rate limiting middleware for production use.

6. **HTTPS**: Always use HTTPS in production (via nginx + Let's Encrypt).

## Performance Optimization

1. **Instance size**: Use at least t3.medium (2 vCPU, 4 GB RAM) for production.

2. **WebR warmup**: The first request after startup will be slow as WebR initializes. Consider making a warmup request after deployment.

3. **Caching**: WebR instance stays warm in memory, so subsequent requests are fast.

4. **Monitoring**: Use PM2 monitoring and set up CloudWatch alarms for EC2 metrics.

## Support

For issues or questions:
- Check application logs: `pm2 logs webr-api`
- Check system logs: `journalctl -u pm2-ubuntu`
- Review PM2 documentation: https://pm2.keymetrics.io/docs/
- Review WebR documentation: https://docs.r-wasm.org/webr/latest/
