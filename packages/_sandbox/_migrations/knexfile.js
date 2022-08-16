require('ts-node').register({ project: 'tsconfig.knex.json' });
require('dotenv').config();

module.exports = {
  client: 'pg',

  connection: `${process.env.POSTGRES}?ssl=true`,

  migrations: {
    directory: `${__dirname}/migrations`,
    disableTransactions: true,
  },
};
