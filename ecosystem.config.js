module.exports = {
  apps: [{
    name: 'webr-api',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/webr',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/webr/logs/error.log',
    out_file: '/home/ubuntu/webr/logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
