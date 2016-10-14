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
import { nodeDefinitions } from './common';
import { Pod, AllContainerStates } from './pod';
import { AllEnvVarTypes } from './env_vars';
import { AllPodVolumeTypes } from './volumes';
import { Node } from './node';
import { Event } from './event';
import * as GraphQLRelay from "graphql-relay";

const {connectionType: AllNodesConnection} =
    GraphQLRelay.connectionDefinitions({name: 'AllNodes', nodeType: Node});

const {connectionType: AllPodsConnection} =
    GraphQLRelay.connectionDefinitions({name: 'AllPods', nodeType: Pod});

const QueryType = new GraphQLObjectType({
    name: 'QueryType',
    fields: {
        node: nodeDefinitions.nodeField,
        podById: {
            type: Pod,
            args: {
                namespace: {type: GraphQLString},
                name: {type: new GraphQLNonNull(GraphQLString)},
            },
            async resolve(root, {namespace, name}, {loaders}) {
                return await loaders.podLoader.load({namespace, name});
            }
        },
        kubeNodeById: {
            type: Node,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(root, {name}, {loaders}) {
                return await loaders.nodeByIdLoader.load(name);
            }
        },
        kubeNodes: {
            type: AllNodesConnection,
            args: GraphQLRelay.connectionArgs,
            async resolve(root, args, {loaders}) {
                const nodes = await loaders.allNodes;
                return GraphQLRelay.connectionFromArray(nodes, args);
            }
        },
        pods: {
            type: AllPodsConnection,
            args: {
                ...GraphQLRelay.connectionArgs,
                namespace: {type: GraphQLString},
            },
            async resolve(root, {namespace, ...args}, {loaders}) {
                const nodes = await loaders.podsByNamespaceLoader.load(namespace || "");
                return GraphQLRelay.connectionFromArray(nodes, args);
            }
        }
    }
});

const schema = new GraphQLSchema({
    types: [].concat(AllEnvVarTypes, AllPodVolumeTypes, AllContainerStates, [Pod, Event, Node]),
    query: QueryType
});

export default schema;
