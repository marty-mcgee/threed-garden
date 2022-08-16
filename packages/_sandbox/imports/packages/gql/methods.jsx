// @flow

export const gqlWrap = (gql: string): string => `query ${gql}`;
export const gqlUnwrap = (gql: string): string => {
  let query = gql;
  for (let i = 0; i < gql.length; i ++) {
    if (gql[i] === '{') {
      query = gql.slice(i);
      break;
    }
  }
  return query;
}
