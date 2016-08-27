import {
    GraphQLScalarType,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLList,
    GraphQLBoolean,
} from "graphql/type";
import { GraphQLError } from 'graphql/error'
import { Kind } from 'graphql/language'
import GraphQLJSON from 'graphql-type-json';
import * as GraphQLRelay from 'graphql-relay';

export async function genericLookup({kind, namespace, name}) {
    if (kind == 'Pod') {
        return await kube.request(`/api/v1/namespaces/${namespace}/pods/${name}`);
    } else if (kind == 'Event') {
        return await kube.request(`/api/v1/namespaces/${namespace}/events/${name}`);
    }
    return null;
}

exports.nodeDefinitions = GraphQLRelay.nodeDefinitions(async (globalId, {kube}) => {
    const {type, id} = GraphQLRelay.fromGlobalId(globalId);
    let [namespace, name] = id.split('/');
    return genericLookup({kind: type, namespace, name});
});

function coerceDate (value) {
    if (value instanceof String || typeof value == 'string') {
        value = new Date(value);
    }

    if (!(value instanceof Date)) {
        // Is this how you raise a 'field error'?
        throw new Error('Field error: value is not an instance of Date');
    }
    if (isNaN(value.getTime())) {
        throw new Error('Field error: value is an invalid Date');
    }
    return value.toJSON();
}

exports.KubernetesDateType = new GraphQLScalarType({
    name: 'DateTime',
    serialize: coerceDate,
    parseValue: coerceDate,
    parseLiteral (ast) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError('Query error: Can only parse strings to dates but got a: ' + ast.kind, [ast]);
        }
        let result = new Date(ast.value);
        if (isNaN(result.getTime())) {
            throw new GraphQLError('Query error: Invalid date', [ast]);
        }
        return result;
    }
});

exports.Metadata = new GraphQLObjectType({
    name: 'Metadata',
    fields: {
        name: {type: new GraphQLNonNull(GraphQLString)},
        namespace: {type: GraphQLString},
        creationTimestamp: {type: exports.KubernetesDateType},
        deletionTimestamp: {type: exports.KubernetesDateType},
        labels: {type: GraphQLJSON},
        annotations: {type: GraphQLJSON},
        ownerReferences: {type: new GraphQLList(new GraphQLObjectType({
            name: 'OwnerReferences',
            fields: {
                kind: {type: GraphQLString},
                name: {type: GraphQLString},
                controller: {type: GraphQLBoolean},
            }
        }))}
    }
});
