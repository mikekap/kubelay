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

const {connectionType: EventConnection} =
        GraphQLRelay.connectionDefinitions({name: 'NodeEvents', nodeType: Event});

exports.Node = new GraphQLObjectType({
    name: 'KubeNode',
    interfaces: [nodeDefinitions.nodeInterface],
    fields: {
        id: GraphQLRelay.globalIdField('Node', e => e.metadata.name),
        metadata: {type: Metadata},
        events: {
            type: EventConnection,
            args: GraphQLRelay.connectionArgs,
            resolve: (e, args, {loaders}) => GraphQLRelay.connectionFromPromisedArray(
                loaders.eventsByObjectLoader.load(e),
                args
            )
        },
        status: {type: new GraphQLObjectType({
            name: 'NodeStatus',
            fields: {
                capacity: {type: GraphQLJSON},
                allocatable: {type: GraphQLJSON},
                phase: {type: GraphQLString},
                conditions: {type: new GraphQLList(new GraphQLObjectType({
                    name: 'NodeCondition',
                    fields: {
                        type: {type: GraphQLString},
                        status: {type: GraphQLString},
                        lastHeartbeatTime: {type: KubernetesDateType},
                        lastTransitionTime: {type: KubernetesDateType},
                        reason: {type: GraphQLString},
                        message: {type: GraphQLString},
                    }
                }))},
                volumesAttached: {type: new GraphQLList(new GraphQLObjectType({
                    name: 'NodeAttachedVolume',
                    fields: {
                        name: {type: GraphQLString},
                        devicePath: {type: GraphQLString},
                    }
                }))}
            }
        })}
    },
    isTypeOf: e => e.kind === 'Node',
});
