// @flow

import React from 'react';

import { wrapPage } from '../../imports/wrap-page';
import { useAuth } from '../../imports/packages/auth/react';
import { gql, useGql, useMutation } from '../../imports/packages/gql/use';

const QUERY = gql`
  query {
    _sandbox {
      id
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
  const { id } = useAuth();

  const result = useGql(QUERY);
  const [clear] = useMutation(CLEAR);
  const [add] = useMutation(ADD);
  return (
    <>
      <div>{JSON.stringify(result.data, null, 1)}</div>
      <div>
        <button onClick={clear}>clear</button>
        <button onClick={() => add({ variables: { userId: id } })}>add</button>
      </div>
    </>
  );
});
