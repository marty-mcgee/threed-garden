// @flow

import _ from 'lodash';
import passport from 'passport';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import gql from 'graphql-tag';

import ApolloClient from 'apollo-client';

import { define_link_with_google_id_return_new_auth_token } from './gql';

export const initAuthGoogleStrategy = (app: any, apolloClient: any) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK,
      },
      async function (accessToken, refreshToken, profile, done) {
        console.log('googleStr', this);
        const {
          id,
          token,
        } = await define_link_with_google_id_return_new_auth_token({
          apolloClient,
          googleId: profile.id,
        });
        done(null, { token, id });
      }
    )
  );
};

export const initAuthGoogle = (path: string, app: any, apolloClient: any) => {
  app.get(
    path,
    passport.authenticate(
      'google',
      { scope: 'https://www.googleapis.com/auth/plus.login' },
    ),
  );
};

export const initAuthGoogleCallback = (path: string, app: any, apolloClient: any) => {
  app.get(
    path, 
    passport.authenticate('google'),
    (req, res) => {
      if (req.user) {
        res.cookie('_sandbox_auth_token', req.user.token);
        res.cookie('_sandbox_auth_id', req.user.id);
      }
      const url = _.get(req, 'cookies._sandbox_auth_redirect');
      res.redirect(url || '/');
    },
  );
};