import express from 'express';
import app from '../app/server'; // React server
import graphQL from '../graphql'; // GraphQL server
import logger from '../resources/logging';

const env = process.env;
const host = env.npm_package_config_appServerHost;
const port = env.npm_package_config_appServerPort;

let router = express();
router.use('/graphql', graphQL);
router.use('/*', app);

let server = router.listen(port, host);
logger.info(`Started server on port ${port}`);

export default server;
