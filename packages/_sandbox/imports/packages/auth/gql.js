// @flow

import _ from 'lodash';
import gql from "graphql-tag";
import uniqid from 'uniqid';

// select node id by some string

export const SELECT_NODE_ID_BY_STRING = gql`
query SELECT_NODE_ID_BY_STRING($format: String, $type: String, $value: String) {
  links(where: {links_props_strings: {format: {_eq: $format}, type: {_eq: $type}, value: {_eq: $value}}}) {
    id
  }
}
`;

export const selectNodeIdByString = async ({
  apolloClient, format, type, value,
}: {
  apolloClient: any, format: string, type: string, value: string,
}) => {
  const r0 = await apolloClient.query({
    query: SELECT_NODE_ID_BY_STRING,
    variables: { format, type, value, },
  });
  return _.get(r0, 'data.links.0.id');
};

// select node strings by some string

export const SELECT_NODE_WITH_STRINGS_BY_STRING = gql`
query SELECT_NODE_WITH_STRINGS_BY_STRING($format: String, $type: String, $value: String, $stringsWhere: links_props_strings_bool_exp) {
  links(where: {links_props_strings: {format: {_eq: $format}, type: {_eq: $type}, value: {_eq: $value}}}) {
    id
    links_props_strings(where: $stringsWhere) {
      id
      type
      format
      value
    }
  }
}
`;

export const selectNodeWithStringsByString = ({
  apolloClient, format, type, value, stringsWhere
}: {
  apolloClient: any, format: string, type: string, value: string, stringsWhere: any
}) => apolloClient.query({
  query: SELECT_NODE_WITH_STRINGS_BY_STRING,
  variables: { format, type, value, stringsWhere },
});

// insert string to node

export const INSERT_STRING_TO_NODE = gql`
mutation INSERT_STRING_TO_NODE($format: String, $type: String, $value: String, $nodeId: String) {
  insert_links_props_strings(objects: { format: $format, type: $type, value: $value, prop_link_id: $nodeId }) {
    returning {
      id
    }
  }
}
`;

export const insertStringToNode = ({
  apolloClient, format, type, value, nodeId,
}: {
  apolloClient: any, format: string, type: string, value: string, nodeId: string
}) => apolloClient.mutate({
  mutation: INSERT_STRING_TO_NODE,
  variables: { format, type, value, nodeId },
});

// after google auth, helps to find exists node attached to google id

export const selectNodeIdByAuthGoogleId = ({
  apolloClient, googleId,
}: {
  apolloClient: any; googleId: string;
}) => selectNodeIdByString({
  apolloClient,
  format: 'txt',
  type: 'auth_google_id',
  value: googleId,
});

// define node, upsert based on google_id and create new auth_token

export const define_link_with_google_id_return_new_auth_token = async ({
  apolloClient, googleId
}: {
  apolloClient: any; googleId: string;
}) => {
  const nodeId = await selectNodeIdByAuthGoogleId({ apolloClient, googleId });
  if (!nodeId) {
    return await insertNodeWithAuthGoogleIdAndToken({
      apolloClient,
      googleId,
    });
  } else {
    await insertStringToNode({
      apolloClient,
      format: 'txt',
      type: 'auth_google_id',
      value: googleId,
      nodeId,
    });
    const token = uniqid();
    await insertStringToNode({
      apolloClient,
      format: 'txt',
      type: 'auth_token',
      value: token,
      nodeId,
    });
    return { id: nodeId, token };
  }
};

// define node, upsert based on username/password and create new auth_token

export const validate_and_define_node_with_username_and_password_return_new_auth_token = async ({
  apolloClient, username, password
}: {
  apolloClient: any; username: string; password: string;
}): {
  nodeId?: string;
  token?: string;
  error?: string;
} => {
  const result = await selectNodeWithStringsByString({
    apolloClient,
    format: 'txt', type: 'auth_username', value: username,
    stringsWhere: { format: { _eq: 'txt' }, type: { _eq: 'auth_password' } }
  });
  const node = _.get(result, 'data.links.0');
  if (!node) return { error: 'node_lost' };
  else {
    const nPassword = _.get(node, 'links_props_strings.0.value');
    if (!nPassword) return { error: 'password_lost' };
    else if (nPassword !== password) return { error: 'password_wrong' };
    else {
      const token = uniqid();
      await insertStringToNode({
        apolloClient,
        format: 'txt',
        type: 'auth_token',
        value: token,
        nodeId: node.id,
      });
      return {
        id: node.id,
        token,
      };
    }
  }
};

// insert node with google id and token

export const INSERT_NODE_WITH_AUTH_GOOGLE_ID_AND_TOKEN = gql`
mutation INSERT_NODE_WITH_AUTH_GOOGLE_ID($googleId: String, $nodeId: String, $token: String) {
  insert_links(objects: {id: $nodeId, links_props_strings: {data: [{format: "txt", type: "auth_google_id", value: $googleId}, {format: "txt", type: "auth_token", value: $token}]}}) {
    returning {
      id
    }
  }
}
`;

export const insertNodeWithAuthGoogleIdAndToken = async({
  apolloClient, googleId, nodeId = uniqid(), token = uniqid(),
}: {
  apolloClient: any; googleId: string; nodeId?: string; token?: string;
}) => {
  await apolloClient.mutate({
    mutation: INSERT_NODE_WITH_AUTH_GOOGLE_ID_AND_TOKEN,
    variables: { googleId, nodeId, token },
  });
  return { token, id: nodeId };
};