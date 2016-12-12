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
import { genericLookup } from './base';
import { Namespace } from './namespace';

function coerceDate(value) {
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
    fields: () => ({
        name: {type: new GraphQLNonNull(GraphQLString)},
        namespace: {
            type: Namespace,
            resolve(meta, args, context) {
                return genericLookup({kind: 'Namespace', name: meta.namespace}, args, context);
            },
        },
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
    })
});
