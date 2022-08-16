// @flow

import _ from 'lodash';

import { initExpress } from '../../../imports/packages/auth/express';
import { generateApolloClient } from '../../../imports/packages/gql';
import { initAuthLogout } from '../../../imports/packages/auth/logout';

const apolloClient = generateApolloClient({}, {
  path: _.get(process, 'env.GQL_PATH'),
  secret: _.get(process, 'env.GQL_SECRET'),
});

const app = initExpress(apolloClient);

initAuthLogout('/api/auth/logout', app, apolloClient);

export default app;