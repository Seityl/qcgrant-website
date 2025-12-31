module.exports = {
  apps: [{
    name: 'qcgrant-api',
    script: 'server.js',
    cwd: '/home/hugo/qcgrant-website/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/home/hugo/qcgrant-website/api/logs/error.log',
    out_file: '/home/hugo/qcgrant-website/api/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};