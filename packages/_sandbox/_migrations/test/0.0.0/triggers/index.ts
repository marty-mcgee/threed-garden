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
import { clear, node, load, check, assert, link, autoAssert, unlink } from './methods';

export const client = generateApolloClient();
export const knex = generateKnex();

describe('triggers', function() {
  beforeEach(clear);
  // afterEach(clear);

  it(`n1`, async function() {
    const n1 = await node(uniqid());
    await autoAssert(this.test.title);
    await unlink(n1);
    await autoAssert(this.test.title);
  });
  it(`n1>n2`, async function() {
    const n1 = await node(uniqid());
    const n2 = await node(uniqid());
    const l1 = await link(n1, n2);
    await autoAssert(this.test.title);
    await unlink(l1);
    await autoAssert(this.test.title);
    await unlink(n2);
    await unlink(n1);
    await autoAssert(this.test.title);
  });
  it(`n1>n2>n3`, async function() {
    const n1 = await node(uniqid());
    const n2 = await node(uniqid());
    const n3 = await node(uniqid());
    const l1 = await link(n1, n2);
    const l2 = await link(n2, n3);
    await autoAssert(this.test.title);
    await unlink(l1);
    await unlink(l2);
    await autoAssert(this.test.title);
    await unlink(n3);
    await unlink(n2);
    await unlink(n1);
    await autoAssert(this.test.title);
  });
  it(`n1>n2>n3,n4`, async function() {
    const n1 = await node(uniqid());
    const n2 = await node(uniqid());
    const n3 = await node(uniqid());
    const n4 = await node(uniqid());
    const l1 = await link(n1, n2);
    const l2 = await link(n2, n3);
    const l3 = await link(n2, n4);
    await autoAssert(this.test.title);
    await unlink(l1);
    await unlink(l2);
    await unlink(l3);
    await autoAssert(this.test.title);
    await unlink(n4);
    await unlink(n3);
    await unlink(n2);
    await unlink(n1);
    await autoAssert(this.test.title);
  });
  it(`n1>(n2>n3,n4),(n5>n6,n7)`, async function() {
    const n1 = await node(uniqid());
    const n2 = await node(uniqid());
    const n3 = await node(uniqid());
    const n4 = await node(uniqid());
    const n5 = await node(uniqid());
    const n6 = await node(uniqid());
    const n7 = await node(uniqid());
    const l1 = await link(n1, n2);
    const l2 = await link(n2, n3);
    const l3 = await link(n2, n4);
    const l4 = await link(n1, n5);
    const l5 = await link(n5, n6);
    const l6 = await link(n5, n7);
    await autoAssert(this.test.title);
    await unlink(l1);
    await unlink(l2);
    await unlink(l3);
    await unlink(l4);
    await unlink(l5);
    await unlink(l6);
    await autoAssert(this.test.title);
    await unlink(n7);
    await unlink(n6);
    await unlink(n5);
    await unlink(n4);
    await unlink(n3);
    await unlink(n2);
    await unlink(n1);
    await autoAssert(this.test.title);
  });

  it(`n1>n2>n3*3`, async function() {
    const n1 = await node(uniqid());
    const n2 = await node(uniqid());
    const n3 = await node(uniqid());
    const l1 = await link(n1, n2);
    const l2 = await link(n2, n3);
    const l3 = await link(n2, n3);
    const l4 = await link(n2, n3);
    await autoAssert(this.test.title);
    await unlink(l1);
    await unlink(l2);
    await unlink(l3);
    await unlink(l4);
    await autoAssert(this.test.title);
    await unlink(n3);
    await unlink(n2);
    await unlink(n1);
    await autoAssert(this.test.title);
  });

  it(`(n1>n2>n3),(n4>n5>n3),(n6>n7>n3)`, async function() {
    const n1 = await node(uniqid());
    const n2 = await node(uniqid());
    const n3 = await node(uniqid());
    const n4 = await node(uniqid());
    const n5 = await node(uniqid());
    const n6 = await node(uniqid());
    const n7 = await node(uniqid());
    const l1 = await link(n1, n2);
    const l2 = await link(n2, n3);
    const l3 = await link(n4, n5);
    const l4 = await link(n5, n3);
    const l5 = await link(n6, n7);
    const l6 = await link(n7, n3);
    await autoAssert(this.test.title);
    await unlink(l1);
    await unlink(l2);
    await unlink(l3);
    await unlink(l4);
    await unlink(l5);
    await unlink(l6);
    await autoAssert(this.test.title);
    await unlink(n7);
    await unlink(n6);
    await unlink(n5);
    await unlink(n4);
    await unlink(n3);
    await unlink(n2);
    await unlink(n1);
    await autoAssert(this.test.title);
  });
});