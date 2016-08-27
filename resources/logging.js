import winston from 'winston';

winston.level = process.env.LOG_LEVEL || 'info';

export default winston;
