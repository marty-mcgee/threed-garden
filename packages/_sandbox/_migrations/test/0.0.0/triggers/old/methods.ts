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

import { generateApolloClient } from '../../../../imports/apollo';
import { generateKnex } from '../../../../imports/knex';

export const client = generateApolloClient();
export const knex = generateKnex();

export const clear = async () => {
  await knex.raw(`DELETE FROM "nodes";`);
  await knex.raw(`DELETE FROM "links";`);
  await knex.raw(`DELETE FROM "links_indexes";`);
};

export const prepareNodes = async (count: number) => {
  return await client.mutate({
    mutation: gql`mutation PREPARE_NODES($objects: [nodes_insert_input!]!) {
      nodes: insert_nodes(objects: $objects) { returning { id } }
    }`,
    variables: {
      objects: _.times(count, () => ({ id: `${uniqid()}` })),
    }
  });
};

export const prepareLinks = async (
  data: IData,
  count: number,
  selectPossibleTargets = selectSafetyLinksFrom,
  getRandomNodeIndex?,
  getRandomSafetyTarget?,
) => {
  const objects = [];
  const randomNodeIndexes = [];
  const randomSafetyTargets = [];

  // console.log(getRandomNodeIndex.toString());
  // console.log(getRandomSafetyTarget.toString());

  for (let i = 0; i < count; i++) {
    const r1 = getRandomNodeIndex(data.nodes, i);
    randomNodeIndexes.push(r1);
    const n = data.nodes[r1];
    const possibleTargets = await selectPossibleTargets(data, n);
    if (!possibleTargets.length) throw new Error('!possibleTargets.length');
    const r2 = getRandomSafetyTarget(possibleTargets, i);
    randomSafetyTargets.push(r2);
    await linkIt(n.id, possibleTargets[r2].id);
  }

  await client.mutate({
    mutation: gql`mutation PREPARE_LINKS($objects: [links_insert_input!]!) {
      links: insert_links(objects: $objects) { returning { id } }
    }`,
    variables: {
      objects,
    }
  });

  return [randomNodeIndexes, randomSafetyTargets];
};

export const selectSafetyLinksFromSQL = (nodeId) => `
SELECT "nodes"."id"
FROM "nodes"
WHERE
"nodes"."id" != '${nodeId}' AND
"nodes"."id" NOT IN (
  SELECT "l1"."target_id"
  FROM "links" as "l1"
  WHERE "l1"."source_id" = '${nodeId}'
) AND
"nodes"."id" NOT IN (
  SELECT "li1"."index_of_id"
  FROM "links_indexes" as "li1"
  WHERE
  "li1"."list_of_id" = '${nodeId}' AND
  "li1"."index_of_id" != '${nodeId}'
);
`;

export const selectSafetyLinksFrom = async (data, node) => {
  return (await knex.raw(selectSafetyLinksFromSQL(node.id))).rows;
};

export interface IData {
  nodes: INode[];
  links: ILink[];
  indexes: IIndex[];
  _nodes?: { [id: string]: INode };
  _links?: { [id: string]: ILink };
  _indexes?: { [id: string]: IIndex };
}

export interface INode {
  id: string;
  links_by_source?: ILink[];
  links_by_target?: ILink[];
  links_by_node?: ILink[];
  indexes_by_index?: IIndex[];
  indexes_by_list?: IIndex[];
}

export interface ILink {
  id: number;
  source_id: string;
  source?: INode;
  target_id: string;
  target?: INode;
  node_id?: string;
  node?: INode;
  type?: string;
}

export interface IIndex {
  id: number;
  list_of_id: string;
  index_of_id: string;
  index_in_id?: number;
  list_id: string;
  depth: number;
}

export const load = async (): Promise<IData> => {
  const nodes: INode[] = (await knex.raw(`SELECT * FROM "nodes";`)).rows;
  const links: ILink[] = (await knex.raw(`SELECT * FROM "links";`)).rows;
  const indexes: IIndex[] = (await knex.raw(`SELECT * FROM "links_indexes";`)).rows;

  const data: IData = {
    nodes, links, indexes,
    _nodes: {}, _links: {}, _indexes: {},
  };

  return data;
};

export const linkIt = async (sourceId, targetId) => {
  await client.mutate({
    mutation: gql`mutation PREPARE_LINKS($objects: [links_insert_input!]!) {
      links: insert_links(objects: $objects) { returning { id } }
    }`,
    variables: {
      objects: { source_id: sourceId, target_id: targetId },
    }
  });
};

export const linking = (_data) => {
  const data = { ..._data };
  const links_by = (name, link) => {
    if (link[`${name}_id`]) {
      const node = data._nodes[link[`${name}_id`]];
      if (node) {
        link[name] = node;
        node[`links_by_${name}`].push(link);
      }
    }
  };

  for (let i0 = 0; i0 < data.nodes.length; i0++) {
    const node = data.nodes[i0];
    data._nodes[data.nodes[i0].id] = node;
    node.links_by_source = [];
    node.links_by_target = [];
    node.links_by_node = [];
    node.indexes_by_index = [];
    node.indexes_by_list = [];
  }
  for (let i0 = 0; i0 < data.links.length; i0++) {
    const link = data.links[i0];
    data._links[data.links[i0].id] = link;
    link.indexes = [];
    links_by('source', link);
    links_by('target', link);
    links_by('node', link);
  }
  for (let i0 = 0; i0 < data.indexes.length; i0++) {
    const index = data.indexes[i0];
    data._indexes[data.indexes[i0].id] = index;
    if (index.index_in_id) {
      index.link = data._links[index.index_in_id];
      data._links[index.index_in_id].indexes.push(index);
    }
    if (index.index_of_id) {
      index.index_node = data._nodes[index.index_of_id];
      data._nodes[index.index_of_id].indexes_by_index.push(index);
    }
    if (index.list_of_id) {
      index.list_node = data._nodes[index.list_of_id];
      data._nodes[index.list_of_id].indexes_by_list.push(index);
    }
  }
  return data;
};

export interface IError {
  nodes?: INode[];
  links?: ILink[];
  indexes?: IIndex[];
  messages: string[];
}

export const check = (data: IData, errors: IError[] = []) => {
  for (let i0 = 0; i0 < data.nodes.length; i0++) {
    const node = data.nodes[i0];
    const error = { nodes: [node], messages: [] };
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

  return errors;
};

export const assert = (name, data, errors, randoms) => {
  fs.writeFileSync(
    `${__dirname}/${name}.log`,
    fastSafeStringify({ errors, randoms }),
  );
  if (errors.length) throw new Error('errors.length != 0');
};

export const loadRandoms = (name) => {
  if (!fs.existsSync(`${__dirname}/${name}.log`)) return;
  const file = fs.readFileSync(`${__dirname}/${name}.log`);
  return JSON.parse(file.toString()).randoms;
};
