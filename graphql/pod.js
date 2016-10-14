import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLInterfaceType,
    GraphQLScalarType,
    GraphQLUnionType,
    GraphQLBoolean,
    GraphQLList
} from 'graphql/type';
import {nodeDefinitions, Metadata, KubernetesDateType} from './common';
import {EnvVar} from './env_vars';
import {Event} from './event';
import {PodVolume} from './volumes';
import GraphQLJSON from 'graphql-type-json';
import * as GraphQLRelay from "graphql-relay";

const ContainerType = new GraphQLObjectType({
    name: 'ContainerType',
    fields: {
        name: {type: new GraphQLNonNull(GraphQLString)},
        image: {type: new GraphQLNonNull(GraphQLString)},
        command: {type: new GraphQLList(GraphQLString)},
        args: {type: new GraphQLList(GraphQLString)},
        ports: {type: new GraphQLList(new GraphQLObjectType({
            name: 'PortType',
            fields: {
                name: {type: GraphQLString},
                hostPort: {type: GraphQLInt},
                containerPort: {type: new GraphQLNonNull(GraphQLInt)},
                protocol: {type: GraphQLString},
                hostIP: {type: GraphQLString},
            }
        }))},
        resources: {type: new GraphQLObjectType({
            name: 'GraphQLResourcesType',
            fields: {
                limits: {type: GraphQLJSON},
                requests: {type: GraphQLJSON},
            }
        })},
        workingDir: {type: GraphQLString},
        env: {type: new GraphQLList(EnvVar)},
    }
});

const ContainerState = new GraphQLInterfaceType({
    name: 'ContainerState',
    fields: {
        __unused: {type: GraphQLString},
    }
});

exports.AllContainerStates = [
    new GraphQLObjectType({
        name: 'ContainerStateWaiting',
        interfaces: [ContainerState],
        fields: {
            __unused: {type: GraphQLString},
            reason: {type: GraphQLString, resolve: e => e.waiting.reason},
            message: {type: GraphQLString, resolve: e => e.waiting.message},
        },
        isTypeOf: e => e.waiting !== undefined,
    }),
    new GraphQLObjectType({
        name: 'ContainerStateRunning',
        interfaces: [ContainerState],
        fields: {
            __unused: {type: GraphQLString},
            startedAt: {type: KubernetesDateType, resolve: e => e.running.startedAt},
        },
        isTypeOf: e => e.running !== undefined,
    }),
    new GraphQLObjectType({
        name: 'ContainerStateTerminated',
        interfaces: [ContainerState],
        fields: {
            __unused: {type: GraphQLString},
            exitCode: {type: new GraphQLNonNull(GraphQLInt), resolve: e => e.terminated.exitCode},
            signal: {type: GraphQLInt, resolve: e => e.terminated.signal},
            reason: {type: GraphQLString, resolve: e => e.terminated.reason},
            message: {type: GraphQLString, resolve: e => e.terminated.message},
            startedAt: {type: KubernetesDateType, resolve: e => e.terminated.startedAt},
            finishedAt: {type: KubernetesDateType, resolve: e => e.terminated.finishedAt},
            containerID: {type: GraphQLString, resolve: e => e.terminated.containerID},
        },
        isTypeOf: e => e.terminated !== undefined,
    }),
];

const LiveContainer = new GraphQLObjectType({
    name: 'LiveContainer',
    fields: {
        name: {type: new GraphQLNonNull(GraphQLString)},
        spec: {type: ContainerType},
        status: {type: new GraphQLObjectType({
            name: 'ContainerStatus',
            fields: {
                state: {type: ContainerState},
                lastState: {type: ContainerState, resolve: e => e.lastState && Object.keys(e.lastState).length > 0 ? e.lastState : null},
                ready: {type: GraphQLBoolean},
                restartCount: {type: GraphQLInt},
                image: {type: GraphQLString},
                containerID: {type: GraphQLString}
            }
        })}
    }
});

exports.PodSpec = new GraphQLObjectType({
    name: 'PodSpec',
    fields: {
        volumes: {type: new GraphQLList(PodVolume)},
        containers: {type: new GraphQLList(ContainerType)},
        serviceAccountName: {type: GraphQLString},
        dnsPolicy: {type: GraphQLString},
        hostname: {type: GraphQLString},
        subdomain: {type: GraphQLString},
    }
});

var {connectionType: EventConnection} =
    GraphQLRelay.connectionDefinitions({name: 'PodEvents', nodeType: Event});

exports.Pod = new GraphQLObjectType({
    name: 'Pod',
    interfaces: [nodeDefinitions.nodeInterface],
    fields: {
        id: GraphQLRelay.globalIdField('Pod', e => `${e.metadata.namespace}/${e.metadata.name}`),
        metadata: {type: Metadata},
        spec: {type: exports.PodSpec},
        containers: {
            type: new GraphQLList(LiveContainer),
            resolve(e) {
                let containers = new Map(e.spec.containers.map(v => [v.name, {name: v.name, spec: v}]));
                for (let status of e.status.containerStatuses) {
                    containers.get(status.name).status = status;
                }
                return Array.from(containers.values());
            },
        },
        events: {
            type: EventConnection,
            args: GraphQLRelay.connectionArgs,
            resolve: (e, args, {loaders}) => GraphQLRelay.connectionFromPromisedArray(
                loaders.eventsByObjectLoader.load(e),
                args
            )
        },
        status: {type: new GraphQLObjectType({
            name: 'PodStatus',
            fields: {
                phase: {type: GraphQLString},
                conditions: {
                    type: new GraphQLList(new GraphQLObjectType({
                        name: 'PodCondition',
                        fields: {
                            type: {type: new GraphQLNonNull(GraphQLString)},
                            status: {type: new GraphQLNonNull(GraphQLString)},
                            lastProbeTime: {type: KubernetesDateType},
                            lastTransitionTime: {type: KubernetesDateType},
                            reason: {type: GraphQLString},
                            message: {type: GraphQLString},
                        }
                    }))
                },
                message: {type: GraphQLString},
                reason: {type: GraphQLString},
                hostIP: {type: GraphQLString},
                podIP: {type: GraphQLString},
                startTime: {type: KubernetesDateType},
            },
        })},
    },
    isTypeOf: e => e.kind === 'Pod',
});
