import React from 'react';
import ReactDom from 'react-dom';
import {Router, applyRouterMiddleware, browserHistory} from 'react-router';
import routes from './routes';
import Relay from 'react-relay';
import useRelay from 'react-router-relay';

ReactDom.render(
  <Router
      history={browserHistory}
      render={applyRouterMiddleware(useRelay)}
      routes={routes}
      environment={Relay.Store}>
  </Router>, document.getElementById('app'))
