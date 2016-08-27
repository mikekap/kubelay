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
            async resolve(root, {namespace, name}, {kube}) {
                namespace = namespace || kube.credentials.namespace;
                return await kube.request({
                    url: `/api/v1/namespaces/${namespace}/pods/${name}`
                });
            }
        }
    }
});

const schema = new GraphQLSchema({
    types: [].concat(AllEnvVarTypes, AllPodVolumeTypes, AllContainerStates, [Pod]),
    query: QueryType
});

export default schema;
