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

import { prepareNodes, linking, load, check, prepareLinks, assert, clear, loadRandoms, selectSafetyLinksFrom, client, knex, linkIt } from './methods';

describe('triggers', function() {
  beforeEach(async () => {
    await clear();
  });
  // afterEach(async () => {
  //   await clear();
  // });

  it.skip('nodes', async () => {
    await prepareNodes(100);
    const data = linking(await load());
    const errors = await check(data);
    assert('nodes', data, errors, []);
  });

  const randomSimpleTree = async function({
    nodesCount = 5,
    linksCount = 5,
    selectPossibleTargets = selectSafetyLinksFrom,
    random: prevRandom,
  }: {
    nodesCount?: number;
    linksCount?: number;
    selectPossibleTargets?: (data: any, node: any) => Promise<{ id: string }[]>,
    random?: any;
  }) {
    let data;

    await prepareNodes(nodesCount);
    data = linking(await load());

    const randoms = await prepareLinks(
      data,
      linksCount,
      selectPossibleTargets,
      ...(prevRandom ? [
        (nodes, i) => {
          return prevRandom[0][i];
        },
        (safetyTargets, i) => {
          return prevRandom[1][i];
        },
      ] : [
        (nodes, i) => {
          return _.random(0, nodes.length - 1);
        },
        (safetyTargets, i) => {
          return _.random(0, safetyTargets.length - 1);
        },
      ]),
    );

    data = linking(await load());

    const errors = await check(data);
    assert(this.test.title, data, errors, randoms);
  };

  it(`safe-n5-l5-i0`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i1`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i2`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i3`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i4`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i5`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i6`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i7`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });
  it(`safe-n5-l5-i8`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 5, linksCount: 5, random: loadRandoms(this.test.title) });
  });

  it(`safe-n50-l50-i0`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i1`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i2`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i3`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i4`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i5`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i6`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i7`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  it(`safe-n50-l50-i8`, async function() {
    await randomSimpleTree.call(this, { nodesCount: 50, linksCount: 50, random: loadRandoms(this.test.title) });
  });
  // it(`recursive-1`, async function() {
  //   let data;
  //   await prepareNodes(2);
  //   data = linking(await load());
  //   await linkIt(data.nodes[0].id, data.nodes[1].id);
  //   await linkIt(data.nodes[1].id, data.nodes[0].id);
  //   data = linking(await load());
  //   const errors = await check(data);
  //   assert(this.test.title, data, errors, null);
  // });
});