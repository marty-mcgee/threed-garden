import Knex from 'knex';

import { export_metadata } from '../imports/export_metadata';
import { defineTable, deleteTable, defineForeignRelation } from '../imports/metadata';
import { replace_metadata } from '../imports/replace_metadata';

import Debug from 'debug';

const debug = Debug('sandbox:0.0.0 metadata');
// console.log("debug", debug)

const delay = (time) => new Promise(res => setTimeout(res, time));

export async function up(knex: Knex) {
  debug('up');

  const md = await export_metadata();
  
  // await delay(1000)

  console.log("md", md)

  const defineEasyPermissions = (table, role, columns, selectFilter = {}) => {
    for (let i = 0; i < md.sources[0].tables.length; i++) {
      if (md.sources[0].tables[i].table === table) {
        md.sources[0].tables[i].insert_permissions.push({
          "role": role,
          "comment": null,
          "permission": {
            "set": {},
            "check": {},
            "columns": columns,
          },
        });
        md.sources[0].tables[i].select_permissions.push({
          "role": role,
          "comment": null,
          "permission": {
            "allow_aggregations": false,
            "computed_fields": [],
            "columns": columns,
            "filter": selectFilter
          },
        });
        md.sources[0].tables[i].update_permissions.push({
          "role": role,
          "comment": null,
          "permission": {
            "set": {},
            "columns": columns,
            "filter": {}
          },
        });
        md.sources[0].tables[i].delete_permissions.push({
          "role": role,
          "comment": null,
          "permission": {
            "filter": {}
          },
        });
      }
    }
  };

  // _sandbox
  debug('_sandbox');
  defineTable(md, '_sandbox');
  defineEasyPermissions('_sandbox', 'user', ['id', 'user_id'], { "user_id": { "_eq": "X-Hasura-User-Id" } });
  defineEasyPermissions('_sandbox', 'anonymous', ['id', 'user_id'], { "user_id": { "_eq": "X-Hasura-User-Id" } });

  // links
  debug('links');
  defineTable(md, 'links');
  defineEasyPermissions('links', 'user', ['id', 'source_id', 'target_id', 'type']);
  defineEasyPermissions('links', 'anonymous', ['id', 'source_id', 'target_id', 'type']);

  defineForeignRelation(md, 'links', 'source_id', 'source', 'links', 'id', 'links_by_source');
  defineForeignRelation(md, 'links', 'target_id', 'target', 'links', 'id', 'links_by_target');

  // links_indexes
  debug('links_indexes');
  defineTable(md, 'links_indexes');
  defineEasyPermissions('links_indexes', 'user', ['id', 'list_of_id', 'index_of_id', 'index_in_id', 'list_id', 'depth']);
  defineEasyPermissions('links_indexes', 'anonymous', ['id', 'list_of_id', 'index_of_id', 'index_in_id', 'list_id', 'depth']);


  defineForeignRelation(md, 'links_indexes', 'list_of_id', 'list_of', 'links', 'id', 'links_indexes_by_list_of');
  defineForeignRelation(md, 'links_indexes', 'index_of_id', 'index_of', 'links', 'id', 'links_indexes_by_index_of');
  defineForeignRelation(md, 'links_indexes', 'index_in_id', 'index_in', 'links', 'id', 'links_indexes_by_index_in');

  // links_props_strings
  debug('links_props_strings');
  defineTable(md, 'links_props_strings');
  defineEasyPermissions('links_props_strings', 'user', ['id', 'prop_link_id', 'value', 'format', 'type']);
  defineEasyPermissions('links_props_strings', 'anonymous', ['id', 'prop_link_id', 'value', 'format', 'type']);

  defineForeignRelation(md, 'links_props_strings', 'prop_link_id', 'prop_link', 'links', 'id', 'links_props_strings');

  // links_props_numbers
  debug('links_props_numbers');
  defineTable(md, 'links_props_numbers');
  defineEasyPermissions('links_props_numbers', 'user', ['id', 'prop_link_id', 'value', 'format', 'type']);
  defineEasyPermissions('links_props_numbers', 'anonymous', ['id', 'prop_link_id', 'value', 'format', 'type']);

  defineForeignRelation(md, 'links_props_numbers', 'prop_link_id', 'prop_link', 'links', 'id', 'links_props_numbers');
  
  debug('replace_metadata');
  await replace_metadata(md);
}

export async function down(knex: Knex) {
  debug('down');

  const md = await export_metadata();

  // links_props_numbers
  debug('links_props_numbers');
  deleteTable(md, 'links_props_numbers');

  // links_props_strings
  debug('links_props_strings');
  deleteTable(md, 'links_props_strings');

  // links_indexes
  debug('links_indexes');
  deleteTable(md, 'links_indexes');

  // links
  debug('links');
  deleteTable(md, 'links');

  // props_types
  debug('props_types');
  deleteTable(md, 'props_types');

  // _sandbox
  debug('_sandbox');
  deleteTable(md, '_sandbox');

  debug('replace_metadata');
  await replace_metadata(md);
}
