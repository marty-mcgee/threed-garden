// @flow

import { useRouter } from 'next/router';

export const fakeRouter = {};

/**
 * Using url query as state storage. Same as `useState`
 * @example
 * const [{ x }, setValue] = useQuery('abc', { x: 1 });
 * @param {string} name
 * @param {*} defaultValue
 * @returns {object} result - [value, setValue] as `useState`
 */
export function useUrlState(name: string, defaultValue: any) {
  const router = useRouter();
  
  const { query, pathname, push } = router || fakeRouter;

  const result = [
    query && query[name] ? JSON.parse(String(query[name])) : defaultValue,
    (value: any) => {
      push({
        pathname,
        query: {
          ...query,
          [name]: JSON.stringify(value),
        },
      });
    },
  ];

  return result;
}

export default useUrlState;
