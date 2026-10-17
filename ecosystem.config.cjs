module.exports = {
  apps: [
    {
      name: 'vigil-saas-server',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1800M',
      node_args: '--max-old-space-size=2048 --expose-gc',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
