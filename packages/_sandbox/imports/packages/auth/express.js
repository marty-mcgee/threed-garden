// @flow

import express from 'express';
import passport from 'passport';

import { initPassportSessions } from './sessions';

export const initExpress = (apolloClient: any) => {
  const app = express();
  
  app.set('json spaces', 2); // number of spaces for indentation
  app.use(express.json());
  app.use(passport.initialize());
  app.use(passport.session());

  initPassportSessions(passport, apolloClient);

  return app;
};