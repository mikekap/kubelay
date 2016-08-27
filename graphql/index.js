import express from 'express';
import graphQLHTTP from 'express-graphql';
import schema from './schema';
import kube from '../resources/kubernetes';

let app = express();
app.use(graphQLHTTP({
    schema,
    graphiql: (process.env.NODE_ENV || 'development') === 'development',
    pretty: true,
    context: {kube},
    formatError: error => ({
        message: error.message,
        locations: error.locations,
        stack: error.stack
    }),
}));

export default app;
