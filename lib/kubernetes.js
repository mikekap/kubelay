import yaml from 'js-yaml';
import fs from 'fs';
import {first} from './util';
import path from 'path';
import request from 'request-promise';
import errors from 'request-promise/errors';
import Promise from 'bluebird';
import logger from 'winston';

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

    let context = first(config.contexts.filter((v) => v.name === contextToUse));
    if (!context) {
        logger.warn(`Could not find context ${contextToUse} in config ${configPath}`);
        return null;
    }

    let cluster = first(config.clusters.filter((v) => v.name === context.context.cluster));
    let user = first(config.users.filter((v) => v.name === context.context.user));

    if (!cluster || !user) {
        throw new Error(`Bad kube config: couldn't find cluster or user: ${context.context.cluster} ${context.context.user}`);
    }

    return {
        server: cluster.cluster.server,
        namespace: context.context.namespace || "default",
        ca: await readFile(path.join(path.dirname(configPath), cluster.cluster['certificate-authority'])),
        username: user.user.username,
        password: user.user.password,
        token: user.user.token,
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
    }

    async request(options) {
        if (options instanceof String || typeof options == 'string') {
            options = {url: options};
        }
        options.url = `${this.credentials.server}/${options.url}`;
        options.json = true;
        options.method = options.method || 'GET';
        if (this.credentials.token) {
            options.auth = {bearer: this.credentials.token};
        } else {
            options.auth = {
                username: this.credentials.username,
                password: this.credentials.password
            };
        }

        logger.debug(`Send request`, options);

        if (this.credentials.ca) {
            options.agentOptions = {
                ca: this.credentials.ca,
            }
        }

        try {
            let result = await request(options);
            console.log('Result is', result);
            return result;
        } catch (e) {
            if (e instanceof errors.StatusCodeError && e.statusCode == 404) {
                return null;
            } else {
                throw e;
            }
        }
    }

    async getEventsForObject(object) {
        const fieldSelector = [
            `involvedObject.kind=${object.kind}`,
            `involvedObject.name=${object.metadata.name}`,
        ].join(',');

        const namespace = object.metadata.namespace;
        const events = await this.request({
            url: `api/v1/namespaces/${namespace}/events`,
            qs: {
                fieldSelector
            }
        });
        if (!events) {
            return [];
        }
        return events.items;
    }
}
