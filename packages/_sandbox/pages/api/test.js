// @flow

import _ from 'lodash';
import { ClientRequest, ServerResponse } from 'express';
import proxy from "http-proxy";

var proxyServer = proxy.createProxyServer({
  ignorePath: true
});

export default (req: ClientRequest, res: ServerResponse) => {
  proxyServer.web(req, res, {
    target: `http://localhost:${_.get(process, 'env.PORT')}/api/json`
  });
};
