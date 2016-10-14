import path from 'path';
import express from 'express';
import React from 'react';
import {renderToString} from 'react-dom/server';
import Helmet from 'react-helmet';
import {RouterContext, match} from 'react-router';
import routes from './routes';

const env = process.env;
const assetsPath = `${env.npm_package_config_appWebpackBaseUrl}/${env.npm_package_version}`;
const publicPath = path.resolve('../public');

let app = express();
app.set('trust proxy', 'loopback');
app.set('x-powered-by', false);
app.use(express.static(publicPath));

app.use((req, res, next) => {
  match({routes, location: req.url}, (error, redirectLocation, renderProps) => {
    if (redirectLocation) return res.redirect(redirectLocation.pathname);
    if (error) return next(error.message);
    if (renderProps == null) return next(error);

    let markup = renderToString(<RouterContext {...renderProps}/>);
    let helmet = Helmet.rewind();
    let html = [
      `<!DOCTYPE html>`,
      `<html>`,
        `<head>`,
          `<title>${helmet.title}</title>`,
          helmet.meta,
          helmet.link,
          `<link rel="stylesheet" href="${assetsPath}/app.css"></link>`,
        `</head>`,
        `<body>`,
          `<div id="app">${markup}</div>`,
        `</body>`,
        `<script type="text/javascript" src="${assetsPath}/app.js"></script>`,
      `</html>`
    ].join('');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
});

export default app;
