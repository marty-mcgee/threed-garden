// @flow

import React from 'react';
import { useState } from 'react';
import color from 'material-color-hash';

import _ from 'lodash';

interface IDataLink {
  [string]: any;
  __typename: string;
  id: string;
  source_id: string;
  target_id: string;
}

interface IDataNode {
  [string]: any;
  __typename: string;
  id: string;
  links_indexes_by_list_of: {
    __typename: string;
    id: number;
    list_of_id: string;
    depth: number;
  }[]
}

interface IViewLink {
  id: string;
  source: string;
  target: string;
  group: string;
  color: string;
  __data: any;
}

interface IViewNode {
  id: string;
  group: string;
  color: string;
  __data: any;
}

const parseLink = (
  input: IDataLink[],
  links: { [string]: IViewLink },
  _road: any,
  nodes: { [string]: IViewNode },
) => {
  if (!_.size(input)) return;
  for (let i = 0; i < input.length; i++) {
    const link = input[i];
    if (!_road[`l${link.id}`]) {
      _road[`l${link.id}`] = true;
      nodes[`l${link.id}`] = {
        id: `l${link.id}`,
        group: link.__typename,
        color: color('links', 500).backgroundColor,
        __data: link,
      };
      if (link.source_id) {
        links[`l${link.id}-source`] = {
          id: `l${link.id}-source`,
          source: `n${link.source_id}`,
          target: `l${link.id}`,
          group: `${link.__typename}-source`,
          color: color('links', 500).backgroundColor,
          __data: link,
        };
      }
      if (link.target_id) {
        links[`l${link.id}-target`] = {
          id: `l${link.id}-target`,
          source: `l${link.id}`,
          target: `n${link.target_id}`,
          group: `${link.__typename}-target`,
          color: color('links', 500).backgroundColor,
          __data: link,
        };
      }
    }
  }
};

const parseIndex = (
  node: IDataNode,
  links: { [string]: IViewLink },
  _road: any,
  nodes: { [string]: IViewNode }
) => {
  if (!_.size(node.links_indexes_by_list_of)) return;
  for (let it = 0; it < node.links_indexes_by_list_of.length; it++) {
    const index = node.links_indexes_by_list_of[it];
    if (!_road[`i${index.id}`]) {
      _road[`i${index.id}`] = true;
      nodes[`i${index.id}`] = {
        id: `i${index.id}`,
        label: `i${index.id} n${index.list_of_id}(${index.depth})`,
        group: index.__typename,
        color: '#a1a1a1',
        __data: index,
      };
      links[`in${index.id}`] = {
        id: `in${index.id}`,
        source: `i${index.id}`,
        target: `n${index.list_of_id}`,
        group: `${index.__typename}`,
        color: '#a1a1a1',
        __data: index,
      };
    }
  }
};

export const hashIntoResult = (
  hash: any = {},
  result: any = [],
) => {
  for (let k = 0; k < result.length; k++) {
    if (hash[result[k].id]) {
      if (!_.isEqual(result[k], hash[result[k].id])) {
        _.merge(result[k], hash[result[k].id]);
      }
      delete hash[result[k].id];
    } else {
      delete hash[result[k].id];
      result.splice(k, 1);
      k--;
    }
  }
  const nk = Object.keys(hash);
  for (let k = 0; k < nk.length; k++) {
    result.push(hash[nk[k]]);
  }
  return result;
};

export const onlyChanged = (
  results: { nodes: IViewNode[]; links: IViewLink[] } = { nodes: [], links: [] },
  hashs: any,
) => {
  const _nodes = hashIntoResult(hashs.nodes, results.nodes);
  results.nodes = _nodes;
  const _links = hashIntoResult(hashs.links, results.links);
  results.links = _links;
  return {
    nodes: results.nodes,
    links: results.links,
  };
};

export function parseNode(
  node: any,
  nodes: { [string]: IViewNode },
  links: { [string]: IViewLink },
  _road: any,
) {
  nodes[`n${node.id}`] = {
    id: `n${node.id}`,
    group: node.__typename,
    color: '#000',
    __data: node,
  };
  parseLink(node.links_by_source, links, _road, nodes);
  parseLink(node.links_by_target, links, _road, nodes);
  const keys = Object.keys(node);
  parseIndex(node, links, _road, nodes);
};

export function useParsed(
  data: { links?: IDataLink[]; },
  results: { nodes: IViewNode[]; links: IViewLink[] } = { nodes: [], links: [] },
) {
  const nodes = {};
  const _road = {};
  const links = {};

  const ns = _.get(data, 'links');
  if (_.size(ns)) {
    for (let n = 0; n < ns.length; n++) {
      parseNode(ns[n], nodes, links, _road);
    }
  }

  for (let l in links) {
    if (!nodes[links[l].source] || !nodes[links[l].target]) {
      delete links[l];
    }
  }

  return onlyChanged(results, { nodes, links });
};
