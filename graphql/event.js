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
import {nodeDefinitions, Metadata, genericLookup, KubernetesDateType} from './common';
import * as GraphQLRelay from "graphql-relay";


exports.Event = new GraphQLObjectType({
    name: 'Event',
    interfaces: [nodeDefinitions.nodeInterface],
    fields: {
        id: GraphQLRelay.globalIdField('Event', e => `${e.metadata.namespace}/${e.metadata.name}`),
        metadata: {type: Metadata},
        involvedObject: {type: new GraphQLObjectType({
            name: 'EventInvolvedObject',
            fields: {
                node: {type: nodeDefinitions.nodeInterface, resolve: genericLookup},
                fieldRef: {type: GraphQLString},
            },
        })},
        type: {type: GraphQLString},
        reason: {type: GraphQLString},
        message: {type: GraphQLString},
        firstTimestamp: {type: KubernetesDateType},
        lastTimestamp: {type: KubernetesDateType},
        count: {type: GraphQLInt},
    },
    isTypeOf: e => e.kind === 'Event',
});
