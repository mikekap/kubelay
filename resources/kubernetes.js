'use strict';

import {KubernetesClient} from '../lib/kubernetes';
import {waitForPromise} from '../lib/blocking';
import logger from './logging';

const client = new KubernetesClient();
waitForPromise(client.loadCredentials());
logger.info(`Loaded kubernetes config; talking to server ${client.credentials.server}`);

export default client;
