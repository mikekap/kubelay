import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLInterfaceType,
} from 'graphql/type';

exports.EnvVar = new GraphQLInterfaceType({
    name: 'EnvVar',
    fields: {
        name: {type: new GraphQLNonNull(GraphQLString)},
    }
});

exports.AllEnvVarTypes = [
    new GraphQLObjectType({
        name: 'ValueEnvVar',
        interfaces: [exports.EnvVar],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            value: {type: new GraphQLNonNull(GraphQLString)},
        },
        isTypeOf: e => e.value !== undefined,
    }),
    new GraphQLObjectType({
        name: 'FieldRefEnvVar',
        interfaces: [exports.EnvVar],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            apiVersion: {type: GraphQLString, resolve: (e) => e.valueFrom.fieldRef.apiVersion },
            fieldPath: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.valueFrom.fieldRef.fieldPath},
        },
        isTypeOf: e => e.valueFrom.fieldRef !== undefined,
    }),
    new GraphQLObjectType({
        name: 'ResourceFieldRefEnvVar',
        interfaces: [exports.EnvVar],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            containerName: {type: GraphQLString, resolve: (e) => e.valueFrom.resourceFieldRef.containerName},
            resource: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.valueFrom.resourceFieldRef.resource},
            divisor: {type: GraphQLString, resolve: (e) => e.valueFrom.resourceFieldRef.divisor},
        },
        isTypeOf: e => e.valueFrom.resourceFieldRef !== undefined,
    }),
    new GraphQLObjectType({
        name: 'ConfigMapRefEnvVar',
        interfaces: [exports.EnvVar],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            // XXX -> ConfigMap
            configMapName: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.valueFrom.configMapKeyRef.name},
            key: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.valueFrom.configMapKeyRef.key},
        },
        isTypeOf: e => e.valueFrom.configMapKeyRef !== undefined,
    }),
    new GraphQLObjectType({
        name: 'SecretKeyRefEnvVar',
        interfaces: [exports.EnvVar],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            // XXX -> secret
            secretName: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.valueFrom.secretKeyRef.name},
            key: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.valueFrom.secretKeyRef.key},
        },
        isTypeOf: e => e.valueFrom.secretKeyRef !== undefined,
    }),
];