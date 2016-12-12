// @flow

import DataLoader from 'dataloader';
import { KubernetesClient } from './kubernetes';
import { pairs, toMap, tap } from './util';
import { flatMap, map, flatten, toArray } from 'lodash-bound';

type PodKeyRaw = {
    namespace: ?string;
    name: string;
};

type PodKeyInMetadata = {
    metadata: PodKeyRaw;
}

type PodKey = PodKeyInMetadata | PodKeyRaw;

export class KubernetesLoaders {
    kube: KubernetesClient;
    podLoader: DataLoader<PodKey, mixed>;
    podsByNamespaceLoader: DataLoader<string, mixed>;
    nodeByIdLoader: DataLoader<string, mixed>;

    constructor(kube: KubernetesClient) {
        this.kube = kube;

        this.podLoader = new DataLoader(
            ::this._loadPods,
            {cacheKeyFn: ::this._namespacedCacheKey});
        this.podsByNamespaceLoader = new DataLoader(
            ::this._loadPodsInNamespace,
            {cacheKeyFn: e => e || this.defaultNamespace,
             batch: false});
        this.nodeByIdLoader = new DataLoader(
            ::this._loadNodes);
        this.eventsByObjectLoader = new DataLoader(
            ::this._loadEventsForObject,
            {cacheKeyFn: ::this._namespacedCacheKey,
             batch: false});
         this.eventsByNamespaceLoader = new DataLoader(
             ::this._loadEventsForNamespace,
             {batch: false});
        this.eventLoader = new DataLoader(
            ::this._loadEvent,
            {batch: false});
        this._allNodes = null;
        this._allNamespaces = null;
    }

    async _loadEventsForNamespace([namespace]) {
        const events = await this.kube.getList(`api/v1/namespaces/${namespace}/events`);
        events.forEach(e => this.eventLoader.prime(e, e));
        return [events];
    }

    async _loadEventsForObject([object]) {
        const fieldSelector = [
            `involvedObject.kind=${object.kind}`,
            `involvedObject.name=${object.metadata.name}`,
        ].join(',');

        const namespace = object.metadata.namespace;
        const url = namespace ? `api/v1/namespaces/${namespace}/events` : `api/v1/events`;
        const events = await this.kube.getList(url, {qs: {fieldSelector}});
        events.forEach(e => this.eventLoader.prime(e, e));
        return [events];
    }

    async _loadEvent([{name, namespace}]) {
        return [await kube.request(`/api/v1/namespaces/${namespace}/events/${name}`)];
    }

    get allNodes(): Promise<mixed[]> {
        if (this._allNodes === null) {
            this._allNodes = this.kube.getList(`/api/v1/nodes`);
        }
        return this._allNodes;
    }

    get allNamespaces(): Promise<mixed[]> {
        if (this._allNamespaces === null) {
            this._allNamespaces = this.kube.getList(`/api/v1/namespaces`);
        }
        return this._allNamespaces;
    }

    get defaultNamespace(): string {
        return this.kube.credentials.namespace;
    }

    _normalizeEntityQuery(e) {
        e = e.metadata || e;
        const namespace = e.namespace || this.defaultNamespace;
        if (!e.name) {
            throw new Error(`Could not find name for entity: ${e}.`);
        }
        return {namespace, name: e.name};
    }

    _namespacedCacheKey(e): string {
        const ne = this._normalizeEntityQuery(e);
        return `${ne.namespace}/${ne.name}`;
    }

    async _loadPodsInNamespace([namespace]: string[]): mixed[] {
        const pods = await this.kube.getList(`/api/v1/namespaces/${namespace || this.defaultNamespace}/pods`);
        pods.forEach(p => this.podLoader.prime(p, p));
        return [pods];
    }

    async _loadPods(pods: PodKey[]): mixed[] {
        pods = pods.map(this._normalizeEntityQuery.bind(this));
        const namespaces = pods.map(e => e.namespace);
        const namespaceResults = await this.podsByNamespaceLoader.loadMany(namespaces);
        const resultsByKey = namespaceResults
            ::flatten()
            ::map(v => [this._namespacedCacheKey(v), v])
            ::toMap();
        return pods::map(::resultsByKey.get);
    }

    async _loadNodes(nodes: string[]): mixed[] {
        const nodeData =
            (await this.allNodes)
            ::map(v => [v.metadata.name, v])
            ::toMap();
        return nodes::map(::nodeData.get);
    }
}
