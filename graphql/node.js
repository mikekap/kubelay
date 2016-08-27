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

exports.Node = new GraphQLObjectType({
    name: 'Node',
    interfaces: [nodeDefinitions.nodeInterface],
    fields: {
        metadata: {type: Metadata},
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
