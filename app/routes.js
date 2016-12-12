import React from 'react';
import {Route} from 'react-router';
import Index from './index';

var RootQueries = {
  root: () => Relay.QL`query { root }`,
};

export default (
  <Route>
    <Route name="index" path="/" component={Index} queries={RootQueries}>

    </Route>
  </Route>
);
