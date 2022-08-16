// @flow

import _ from 'lodash';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import gql from 'graphql-tag';

import ApolloClient from 'apollo-client';
import { ClientRequest, ServerResponse } from 'express';

import { validate_and_define_node_with_username_and_password_return_new_auth_token } from './gql';

// success / node_lost / password_lost / password_wrong

export const initAuthLocal = async (req: ClientRequest, res: ServerResponse, apolloClient: any) => {
  const username = _.get(req, 'query.username');
  const password = _.get(req, 'query.password');

  let result;
  try {
    result = await validate_and_define_node_with_username_and_password_return_new_auth_token({
      apolloClient,
      username, password,
    });
  } catch(error) {
    return res.send({ error: 'broken' });
  }
  res.send(result);
};