// @flow

import _ from 'lodash';

import { initExpress } from '../../../../imports/packages/auth/express';
import { initAuthGoogle, initAuthGoogleStrategy } from '../../../../imports/packages/auth/google';
import { generateApolloClient } from '../../../../imports/packages/gql';

const apolloClient = generateApolloClient({}, {
  path: _.get(process, 'env.GQL_PATH'),
  secret: _.get(process, 'env.GQL_SECRET'),
});

const app = initExpress(apolloClient);

initAuthGoogleStrategy(app, apolloClient);
initAuthGoogle('/api/auth/google', app, apolloClient);

export default app;