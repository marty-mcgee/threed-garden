import Knex from 'knex';
import uniqid from 'uniqid';

export async function up(knex: Knex) {
  await knex('links').insert({ id: 'anonymous' });
  await knex('links_props_strings').insert({ prop_link_id: 'anonymous', value: 'anonymous', format: 'txt', type: 'auth_token' });

  await knex('links').insert({ id: 'abc' });
  await knex('links_props_strings').insert({ prop_link_id: 'abc', value: 'abc', format: 'txt', type: 'auth_username' });
  await knex('links_props_strings').insert({ prop_link_id: 'abc', value: 'abc', format: 'txt', type: 'auth_password' });
}

export async function down(knex: Knex) {}
