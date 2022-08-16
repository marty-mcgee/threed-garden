import * as _ from 'lodash';

import Debug from 'debug';

const debug = Debug('sandbox:metadata');

export interface IObjectRelationship {
  using: {
    foreign_key_constraint_on?: string;
    manual_configuration?: {
      remote_table: string,
      column_mapping: {
        [key: string]: string;
      }
    }
  };
  name: string;
  comment?: string;
}

export interface IArrayRelationship {
  using: {
    foreign_key_constraint_on?: {
      column: string,
      table: string;
    };
    manual_configuration?: {
      remote_table: string,
      column_mapping: {
        [key: string]: string;
      },
    },
  };
  name: string;
  comment?: string;
}

export interface IPermissionRuleInsert {
  set: any;
  check: any;
  columns: string[];
}

export interface IPermissionRuleSelect {
  allow_aggregations: boolean;
  computed_fields: [];
  columns: string[];
  filter: any;
}

export interface IPermissionRuleUpdate {
  set: any;
  columns: string[];
  filter: any;
}

export interface IPermissionRuleDelete {
  filter: any;
}

export interface IPermission<IPermissionRule> {
  role: string;
  comment: any;
  permission: IPermissionRule;
}

export interface ITable {
  table: string;
  object_relationships: IObjectRelationship[];
  array_relationships: IArrayRelationship[];
  insert_permissions: IPermission<IPermissionRuleInsert>[];
  select_permissions: IPermission<IPermissionRuleSelect>[];
  update_permissions: IPermission<IPermissionRuleUpdate>[];
  delete_permissions: IPermission<IPermissionRuleDelete>[];
  event_triggers: any[];
}

export interface IMetaData {
  functions: [];
  remote_schemas: [];
  query_collections: [];
  allowlist: [];
  tables: ITable[];
  query_templates: [];
}

export const reset = () => ({
  functions: [],
  remote_schemas: [],
  query_collections: [],
  allowlist: [],
  tables: [],
  query_templates: []
});

export const defineTable = (md: IMetaData, table: string) => {
  deleteTable(md, table);
  const t = {
    table,
    object_relationships: [],
    array_relationships: [],
    insert_permissions: [],
    select_permissions: [],
    update_permissions: [],
    delete_permissions: [],
    event_triggers: [],
  };
  debug('insertTable', t);
  md.tables.push(t);
};

export const deleteTable = (md: IMetaData, table: string) => {
  const removed = _.remove(md.tables, (t: ITable) => t.table === table);
  debug('deleteTable', removed);
};

export const defineForeignRelation = (
  md: IMetaData, 
  fromTable: string, 
  fromColumn: string, 
  fromName: string, 
  toTable: string, 
  toColumn: string, 
  toName: string,
) => {
  let _fromTable: ITable;
  let _toTable: ITable;
  for (let i = 0; i < md.tables.length; i++) {
    if (md.tables[i].table === fromTable) _fromTable = md.tables[i];
    if (md.tables[i].table === toTable) _toTable = md.tables[i];
  }

  if (!_fromTable) console.log(`!fromTable ${fromTable} in ${fromTable}(${fromName}) - ${toTable}(${toName})`);
  if (!_toTable) console.log(`!toTable ${toTable} in ${fromTable}(${fromName}) - ${toTable}(${toName})`);

  const objR = {
    using: {
      manual_configuration: {
        remote_table: toTable,
        column_mapping: {
          [fromColumn]: toColumn,
        }
      }
    },
    name: fromName,
    comment: null,
  };

  const arrR = {
    using: {
      manual_configuration: {
        remote_table: fromTable,
        column_mapping: {
          [toColumn]: fromColumn,
        },
      },
    },
    name: toName,
    comment: null,
  };

  debug('insertForeignRelation object_relationships', objR);
  _fromTable.object_relationships.push(objR);

  debug('insertForeignRelation array_relationships', arrR);
  _toTable.array_relationships.push(arrR);
};
