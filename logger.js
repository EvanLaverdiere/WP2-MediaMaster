const pino = require('pino')

const logger = pino({
    level: 'debug',
},
    pino.destination('logs/server-log')
);

module.exports = logger;