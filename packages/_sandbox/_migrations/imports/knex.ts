import 'mocha';

import knex from 'knex';

export const generateKnex = () => {
  return knex(require('../knexfile'));
};
