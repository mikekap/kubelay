import express from 'express';
import graphQLHTTP from 'express-graphql';
import schema from './schema';
import kube from '../resources/kubernetes';
import {KubernetesLoaders} from '../lib/kubernetes-loaders';

let app = express();
app.use(graphQLHTTP((req, resp) => {
    return {
        schema,
        graphiql: (process.env.NODE_ENV || 'development') === 'development',
        pretty: true,
        context: {loaders: new KubernetesLoaders(kube)},
        formatError: error => ({
            message: error.message,
            locations: error.locations,
            stack: ("" + error.stack).split("\n")
        }),
    }
}));

export default app;
