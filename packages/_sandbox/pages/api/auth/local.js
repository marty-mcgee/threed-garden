// @flow

import _ from 'lodash';

import { ClientRequest, ServerResponse } from 'express';

import { initExpress } from '../../../imports/packages/auth/express';
import { generateApolloClient } from '../../../imports/packages/gql';
import { initAuthLocal } from '../../../imports/packages/auth/local';

const apolloClient = generateApolloClient({}, {
  path: _.get(process, 'env.GQL_PATH'),
  secret: _.get(process, 'env.GQL_SECRET'),
});

export default async (req: ClientRequest, res: ServerResponse) => {
  await initAuthLocal(req, res, apolloClient);
};