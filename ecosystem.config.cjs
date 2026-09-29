const path = require('node:path');

module.exports = {
  apps: [{
    name: 'roshana-app',
    cwd: __dirname,
    script: path.join(__dirname, 'scripts', 'start.mjs'),
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '512M',
    time: true,
    env: { NODE_ENV: 'production', APP_HOST: '127.0.0.1' },
    // PORT is read from .env.local by start.mjs; the default is 3200.
  }],
};
