// @flow

import React, { useContext } from 'react';
import { RouterContext } from 'next-server/dist/lib/router-context';

import { useUrlState } from '../../imports/packages/use-url-state';
import { wrapPage } from '../../imports/wrap-page';
import { useRouter } from '../../imports/packages/gql/ssr';

export default wrapPage(() => {
  const router = useRouter();

  return (
    <>
      <pre>{JSON.stringify(router, null, 2)}</pre>
    </>
  );
});
