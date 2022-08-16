import Knex from 'knex';

import Debug from 'debug';

const debug = Debug('sandbox:0.0.0 sql');

export async function up(knex: Knex) {
  debug('up');

  // _sandbox
  debug('_sandbox');
  await knex.schema.createTable('_sandbox', (table) => {
    table
      .increments('id')
      .notNullable()
      .unique()
      .primary();

    table
      .text('user_id');
  });

  // links
  debug('links');
  await knex.schema.createTable('links', (table) => {
    table
      .text('id')
      .primary();
    table
      .text('source_id');
    table
      .text('target_id');
    table
      .text("type");
  });

  // links_indexes
  debug('links_indexes');
  await knex.schema.createTable('links_indexes', (table) => {
    table
      .increments('id')
      .primary();

    table
      .text('list_of_id')
      .notNullable();
    table
      .text('index_of_id')
      .notNullable();
    table
      .text('index_in_id');
    table
      .text('list_id')
      .notNullable();
    table
      .integer('depth')
      .notNullable();
  });

  // links_props_strings
  debug('links_props_strings');
  await knex.schema.createTable('links_props_strings', (table) => {
    table
      .increments('id')
      .primary();

    table
      .text('prop_link_id')
      .notNullable();

    table
      .text('value')
      .notNullable();
    table
      .text('format')
      .notNullable();
    table
      .text('type')
      .notNullable();
  });

  // links_props_numbers
  debug('links_props_numbers');
  await knex.schema.createTable('links_props_numbers', (table) => {
    table
      .increments('id')
      .primary();

    table
      .text('prop_link_id')
      .notNullable();

    table
      .integer('value')
      .notNullable();
    table
      .text('format')
      .notNullable();
    table
      .text('type')
      .notNullable();
  });
}

export async function down(knex: Knex) {
  debug('down');

  // links_props_numbers
  debug('links_props_numbers');
  await knex.schema.dropTableIfExists('links_props_numbers');

  // links_props_strings
  debug('links_props_strings');
  await knex.schema.dropTableIfExists('links_props_strings');

  // links_indexes
  debug('links_indexes');
  await knex.schema.dropTableIfExists('links_indexes');

  // links
  debug('links');
  await knex.schema.dropTableIfExists('links');

  // _sandbox
  debug('_sandbox');
  await knex.schema.dropTableIfExists('_sandbox');
}
