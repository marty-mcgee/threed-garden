// @flow

import Gql from 'graphql-tag';
import { useQuery as _useQuery, useSubscription as _useSubscription, useMutation as _useMutation, useApolloClient as _useApolloClient } from '@apollo/react-hooks';
import _ from 'lodash';

// TODO ...args to gql options

export function useQuery(query: string, ...args: any[]) {
  return _useQuery(toGql(query), ...args);
};

export function useSubscription(query: string, ...args: any[]) {
  return _useSubscription(toGql(query), ...args);
};

export function useMutation(query: string, ...args: any[]) {
  return _useMutation(toGql(query), ...args);
};

/**
 * @typedef {object} UseGraphqlResult
 * @property {*} data
 * @property {boolean} loading
 * @property {*} error
 */

export const toGqls = _.memoize(queryString => {
  return queryString ? {
    query: Gql`query ${queryString}`,
    subscription: Gql`subscription ${queryString}`,
  } : {};
});

/**
 * React hook hybrid of useQuery and useSubscription.
 * @param {GraphqlTag} query
 * @param {*} options - useQuery and useSubscription options
 * @return {UseGraphqlResult} result
 */
export function useGql(queryString: string, options: any = {}) {
  const { query, subscription } = toGqls(queryString);

  // $flowignore
  const qr = useQuery(query, { ssr: !process.browser, ...options });
  const sr = useSubscription(subscription, options);

  if (sr && sr.loading)
    return { data: qr.data, loading: qr.loading, error: qr.error };
  return { data: sr.data, loading: sr.loading, error: sr.error };
}

export function gql(strings: any) {
  return strings[0];
}

export const toGql = _.memoize((string: string) => {
  return Gql`${string}`;
});
