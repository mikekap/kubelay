import yaml from 'js-yaml';
import fs from 'fs';
import {maybeStripSuffix} from './util';
import path from 'path';
import request from 'request-promise';
import errors from 'request-promise/errors';
import Promise from 'bluebird';
import logger from 'winston';
import {find, map, toArray} from 'lodash-bound';

const readFile = Promise.promisify(fs.readFile);

async function loadCredentialsFromKubeConfig(
    configPath = path.join(process.env.HOME, '.kube/config'),
    contextToUse = '') {
    let config;
    try {
        let contents = await readFile(configPath, 'utf8');
        config = yaml.safeLoad(contents);
    } catch (e) {
        logger.warn(`Could not load kubernetes config from ${configPath}: ${e}`);
        return null;
    }

    if (!contextToUse) {
        contextToUse = config['current-context'];
    }

    let context = config.contexts::find((v) => v.name === contextToUse);
    if (!context) {
        logger.warn(`Could not find context ${contextToUse} in config ${configPath}`);
        return null;
    }

    let cluster = config.clusters::find((v) => v.name === context.context.cluster);
    let user = config.users::find((v) => v.name === context.context.user);

    if (!cluster || !user) {
        throw new Error(`Bad kube config: couldn't find cluster or user: ${context.context.cluster} ${context.context.user}`);
    }

    async function readConfigFile(configPath) {
        if (configPath) {
            return await readFile(path.resolve(path.dirname(configPath), configPath));
        } else {
            return null;
        }
    }

    // TODO(mikekap): Support inline versions of certs.
    return {
        server: cluster.cluster.server,
        namespace: context.context.namespace || "default",
        ca: await readConfigFile(cluster.cluster['certificate-authority']),
        username: user.user.username,
        password: user.user.password,
        clientCert: await readConfigFile(user.user['client-certificate']),
        clientKey: await readConfigFile(user.user['client-key']),
        token: user.user.token,
    }
}

export async function loadCredentialsFromCluster() {
  try {
    const rootDir = '/var/run/secrets/kubernetes.io/serviceaccount/';
    const namespacePromise = readFile(path.join(rootDir, 'namespace'));
    const tokenPromise = readFile(path.join(rootDir, 'token'));
    const crtPromise = readFile(path.join(rootDir, 'ca.crt'));
    return {
      server: 'kubernetes',
      namespace: await namespacePromise,
      ca: await crtPromise,
      token: await tokenPromise,
    };
  } catch (e) {
    logger.warn(`Failed to load credentials in cluster: ${e}`);
    return null;
  }
}

export function templateToSelector(thing) {
    let selector = thing.spec.selector;
    var resultSelector = [];
    for (let key in selector.matchLabels) {
        if (selector.matchLabels.hasOwnProperty(key)) {
            resultSelector.push(`${key}=${selector.matchLabels[key]}`);
        }
    }
    (selector.matchExpressions || []).forEach(
        ({key, operator, values}) =>
            resultSelector.push(`${key} ${operator} (${values.join(',')})`));
    return resultSelector.join(',');
}

export class KubernetesClient {
    initialize(credentials = {}) {
        this.credentials = credentials;
    }

    async loadCredentials() {
        this.credentials = await loadCredentialsFromKubeConfig();
        if (!this.credentials) {
            this.credentials = await loadCredentialsFromCluster();
        }
    }

    async request(options) {
        if (options instanceof String || typeof options == 'string') {
            options = {url: options};
        }
        options.url = `${this.credentials.server}/${options.url}`;
        options.json = true;
        options.method = options.method || 'GET';

        logger.debug(`Send request`, options);

        if (this.credentials.token) {
            options.auth = {bearer: this.credentials.token};
        } else if (this.credentials.username) {
            options.auth = {
                username: this.credentials.username,
                password: this.credentials.password
            };
        } else if (this.credentials.clientKey) {
            options.cert = this.credentials.clientCert;
            options.key = this.credentials.clientKey;
        }

        if (this.credentials.ca) {
            options.ca = this.credentials.ca;
        }

        try {
            let result = await request(options);
            logger.debug(`Got response`, result);
            return result;
        } catch (e) {
            if (e instanceof errors.StatusCodeError && e.statusCode == 404) {
                return null;
            } else {
                throw e;
            }
        }
    }

    async getList(url, options) {
        const result = await this.request({
            url,
            ...options
        });
        const kind = maybeStripSuffix(result.kind, 'List');
        result.items.forEach(e => e.kind = kind);
        return result.items;
    }
}
