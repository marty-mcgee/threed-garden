import 'mocha';

import gql from 'graphql-tag';
import fs from 'fs';
import _ from 'lodash';
import ApolloClient from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'node-fetch';
import fastSafeStringify from 'fast-safe-stringify';
import uniqid from 'uniqid';

import { generateApolloClient } from '../../../imports/apollo';
import { generateKnex } from '../../../imports/knex';

export const client = generateApolloClient();
export const knex = generateKnex();

export const clear = async () => {
  await knex.raw(`DELETE FROM "links";`);
  await knex.raw(`DELETE FROM "links_indexes";`);
};

export const node = async (nodeId): Promise<string> => {
  await knex.raw(`INSERT INTO "links" ("id") VALUES ('${nodeId}') RETURNING id;`);
  return nodeId;
};

export const link = async (sourceId, targetId, id = uniqid()): Promise<string> => {
  return (await knex.raw(`INSERT INTO "links" ("id", "source_id", "target_id") VALUES ('${id}', '${sourceId}', '${targetId}') RETURNING id;`)).rows[0].id;
};

export const unlink = async (linkId: string) => {
  await knex.raw(`DELETE FROM "links" WHERE "id" = '${linkId}';`);
};

export interface IData {
  links: ILink[];
  indexes: IIndex[];
  _links?: { [id: string]: ILink };
  _indexes?: { [id: string]: IIndex };
}

export interface ILink {
  id: string;
  source_id: string;
  source?: ILink;
  target_id: string;
  target?: ILink;
  type?: string;
  indexes?: IIndex[];
  links_by_source?: ILink[];
  links_by_target?: ILink[];
  indexes_by_index?: IIndex[];
  indexes_by_list?: IIndex[];
}

export interface IIndex {
  id: number;
  list_of_id: string;
  index_of_id: string;
  index_in_id?: number;
  list_id: string;
  depth: number;
}

export interface IError {
  links?: ILink[];
  indexes?: IIndex[];
  messages: string[];
}

export const linking = (_data) => {
  const data = { ..._data };
  const links_by = (name, link) => {
    if (link[`${name}_id`]) {
      const node = data._links[link[`${name}_id`]];
      if (node) {
        link[name] = node;
        node[`links_by_${name}`].push(link);
      }
    }
  };

  for (let i0 = 0; i0 < data.links.length; i0++) {
    const node = data.links[i0];
    data._links[data.links[i0].id] = node;
    node.links_by_source = [];
    node.links_by_target = [];
    node.indexes_by_index = [];
    node.indexes_by_list = [];
  }
  for (let i0 = 0; i0 < data.links.length; i0++) {
    const link = data.links[i0];
    data._links[data.links[i0].id] = link;
    link.indexes = [];
    links_by('source', link);
    links_by('target', link);
  }
  for (let i0 = 0; i0 < data.indexes.length; i0++) {
    const index = data.indexes[i0];
    data._indexes[data.indexes[i0].id] = index;
    if (index.index_in_id) {
      index.link = data._links[index.index_in_id];
      if (data._links[index.index_in_id]) {
        data._links[index.index_in_id].indexes.push(index);
      }
    }
    if (data._links[index.index_of_id]) {
      if (index.index_of_id) {
        index.index_of = data._links[index.index_of_id];
        data._links[index.index_of_id].indexes_by_index.push(index);
      }
      if (index.list_of_id) {
        index.list_of = data._links[index.list_of_id];
        data._links[index.list_of_id].indexes_by_list.push(index);
      }
    }
  }
  return data;
};

export const load = async (): Promise<IData> => {
  const links: ILink[] = (await knex.raw(`SELECT * FROM "links";`)).rows;
  const indexes: IIndex[] = (await knex.raw(`SELECT * FROM "links_indexes";`)).rows;

  const data: IData = {
    links, indexes,
    _links: {}, _indexes: {},
  };

  return linking(data);
};

export const check = (data: IData, errors: IError[] = []) => {
  for (let i0 = 0; i0 < data.links.length; i0++) {
    const node = data.links[i0];
    const error = { link: [node], messages: [] };
    if (!node.indexes_by_index.length) error.messages.push('!node.indexes_by_index.length');
    // если не корень, допускаем что у родителя линки аргументированны
    if (node.links_by_target.length) {
      // перейти к родителям, посмотреть на его списки индексов, продлить их на нод и сравнить
      let rI = 0; // indexes without recursions
      let nI = 0;
      for (let s = 0; s < node.links_by_target.length; s++) {
        const sn = node.links_by_target[s].source;
        rI += sn.indexes_by_list.length;
        nI += sn.indexes_by_list.length + _.uniqBy(sn.indexes_by_list, 'list_id').length;
      }
      if (nI != node.indexes_by_list.length) error.messages.push(`invalid indexes count rI: ${rI} nI: ${nI} i_by_l: ${node.indexes_by_list.length}`)
    } else {
      if (!(node.indexes_by_list.length === 1)) error.messages.push('root node must have only one index in they list')
    }
    if (error.messages.length) errors.push(error);
  }

  for (let i0 = 0; i0 < data.links.length; i0++) {
    const link = data.links[i0];
    const error = { links: [link], messages: [] };
    if (link.source_id && link.target_id) {
      if (!link.indexes.length) error.messages.push('!link.indexes.length');
    }
    if (error.messages.length) errors.push(error);
  }

  if (data.indexes.length && !data.links.length) errors.push({ messages: ['indexes.length && !links.length'] });
  if (!data.indexes.length && data.links.length) errors.push({ messages: ['!indexes.length && links.length'] });

  return errors;
};

export const assert = (name, data, errors) => {
  fs.writeFileSync(
    `${__dirname}/${name}.log`,
    fastSafeStringify({ errors, data }),
  );
  if (errors.length) throw new Error('errors.length != 0');
};

export const autoAssert = async (name) => {
  const data = await load();
  const errors = check(data);
  assert(name, data, errors);
};
