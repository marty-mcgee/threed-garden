// @flow

import React, { useState } from 'react';
import gql from 'graphql-tag';

import { wrapPage } from '../../imports/wrap-page';
import { useGql, useMutation } from '../../imports/packages/gql/use';
import Graphiql, { generateGraphiqlFetcher } from '../../imports/packages/graphiql';

const fetcher = generateGraphiqlFetcher({
  path: process.env.GQL_PATH,
  secret: process.env.GQL_SECRET,
});

export default wrapPage(() => {
  const [query, setQuery] = useState('');
  const [explorerIsOpen, setExplorerIsOpen] = useState(true);

  return (
    <>
      <Graphiql
        query={query}
        setQuery={setQuery}
        explorerIsOpen={explorerIsOpen}
        setExplorerIsOpen={setExplorerIsOpen}
        fetcher={fetcher}
      />
    </>
  );
});
