// @flow

import React, { useContext, useEffect, useState } from 'react';

import Cookies from 'js-cookie';

import { useTheme, Typography, Button, Grid } from '@material-ui/core';
import { Picture } from '../../imports/packages/picture';
import { wrapPage } from '../../imports/wrap-page';
import _ from 'lodash';
import Link from 'next/link';
import { useAuth } from '../../imports/packages/auth/react';
import { gql, useGql, useMutation } from '../../imports/packages/gql/use';

const QUERY = gql`
  query {
    _sandbox {
      id
      user_id
    }
  }
`;

const CLEAR = gql`
  mutation {
    delete__sandbox(where: {}) {
      returning {
        id
      }
    }
  }
`;

const ADD = gql`
  mutation ADD($userId: String) {
    insert__sandbox(objects: { user_id: $userId }) {
      returning {
        id
      }
    }
  }
`;


export default wrapPage(() => {
  const { auth_token, id, localLogin, logout, loading } = useAuth();

  const [ajaxR, setAjaxR] = useState<any>();

  const result = useGql(QUERY);
  const [clear] = useMutation(CLEAR);
  const [add] = useMutation(ADD);

  return (
    <>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <div>
            <div>_sandbox_auth_token: {auth_token}</div>
            <div>_sandbox_auth_id: {id}</div>
            <hr/>
            <div>
              <Link href="/api/auth/google"><a>/api/auth/google</a></Link>
            </div>
            <div>
              <Link href="/api/auth/yandex"><a>/api/auth/yandex</a></Link>
            </div>
            <div>
              <Link href="/api/auth/vk"><a>/api/auth/vk</a></Link>
            </div>
            <div>
              <Link href="/api/auth/ok"><a>/api/auth/ok</a></Link>
            </div>
            <hr/>
            <div>
              <Link href="/api/auth/ok?username=abc&password=def"><a>/api/auth/local abc def</a></Link>
            </div>
            <div>
              <Link href="/api/auth/ok?username=abc&password=abc"><a>/api/auth/local abc abc</a></Link>
            </div>
            <hr/>
            <div>
              <Link href="/api/auth/logout"><a>/api/auth/logout</a></Link>
            </div>
            <hr/>
            <div>
              <a href="#" onClick={async () => setAjaxR(await localLogin('abc','def'))}>ajax /api/auth/local abc def</a>
            </div>
            <div>
              <a href="#" onClick={async () => setAjaxR(await localLogin('abc','abc'))}>ajax /api/auth/local abc abc</a>
            </div>
            <hr/>
            <div>
              <a href="#" onClick={async () => setAjaxR(await logout())}>ajax /api/auth/logout</a>
            </div>
            <hr/>
            <div>
              loading: {loading ? 'true' : 'false'}
            </div>
            <pre>
              {JSON.stringify(ajaxR, null, 2)}
            </pre>
          </div>
        </Grid>
        <Grid item xs={12} sm={6}>
          <div>{JSON.stringify(result.data, null, 1)}</div>
          <div>
            <button onClick={clear}>clear</button>
            <button onClick={() => add({ variables: { userId: id } })}>add</button>
          </div>
        </Grid>
      </Grid>
    </>
  );
});
