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

exports.PodVolume = new GraphQLInterfaceType({
    name: 'Volume',
    fields: {
        name: {type: new GraphQLNonNull(GraphQLString)},
    }
});

exports.AllPodVolumeTypes = [
    new GraphQLObjectType({
        name: 'HostPath',
        interfaces: [exports.PodVolume],
        fields: {
            name: { type: new GraphQLNonNull(GraphQLString) },
            path: { type: GraphQLString, resolve: (e) => e.hostPath.path },
        },
        isTypeOf: e => e.hostPath !== undefined,
    }),
    new GraphQLObjectType({
        name: 'EmptyDir',
        interfaces: [exports.PodVolume],
        fields: {
            name: { type: new GraphQLNonNull(GraphQLString) },
        },
        isTypeOf: e => e.emptyDir !== undefined,
    }),
    new GraphQLObjectType({
        name: 'Secret',
        interfaces: [exports.PodVolume],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            // XXX -> secret
            secretName: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.secret.secretName}
        },
        isTypeOf: e => e.secret !== undefined,
    }),
    new GraphQLObjectType({
        name: 'PersistentVolumeClaim',
        interfaces: [exports.PodVolume],
        fields: {
            name: {type: new GraphQLNonNull(GraphQLString)},
            // XXX -> PersistentVolumeClaim
            claimName: {type: new GraphQLNonNull(GraphQLString), resolve: (e) => e.persistentVolumeClaim.claimName},
            readOnly: {type: GraphQLBoolean, resolve: (e) => e.persistentVolumeClaim.readOnly}
        },
        isTypeOf: e => e.persistentVolumeClaim !== undefined,
    }),
    new GraphQLObjectType({
        name: 'AwsElasticBlockStore',
        interfaces: [exports.PodVolume],
        fields: {
            name: { type: new GraphQLNonNull(GraphQLString) },
            volumeId: { type: GraphQLString, resolve: (e) => e.awsElasticBlockStore.volumeId },
            fsType: { type: GraphQLString, resolve: (e) => e.awsElasticBlockStore.fsType },
            partition: { type: GraphQLInt, resolve: (e) => e.awsElasticBlockStore.partition },
            readOnly: { type: GraphQLBoolean, resolve: (e) => e.awsElasticBlockStore.readOnly },
        },
        isTypeOf: e => e.awsElasticBlockStore !== undefined,
    }),
];
