module.exports = {
    apps: [{
      name: 'fwms',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/wms/frontend',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      
      error_file: '/home/wmstaging/.pm2/logs/fwms-error.log',
      out_file: '/home/wmstaging/.pm2/logs/fwms-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      env: {
        NODE_ENV: 'development',
        PORT: 5173
      },
      
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }]
  };