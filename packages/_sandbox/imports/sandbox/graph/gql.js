import { gql } from '../../packages/gql/use';

export const QUERY = gql`{
  links {
    id
    links_indexes_by_list_of {
      id
      index_in_id
      index_of_id
      list_id
      list_of_id
      depth
    }
    links_by_source {
      id
      source_id
      target_id
    }
    links_by_target {
      id
      source_id
      target_id
    }
  }
}`;

export const ADD_ROOT_NODE = gql`mutation AddRootNode($nodeId: String) {
  insert_links(objects: {id: $nodeId}) {
    returning {
      id
    }
  }
}`;

export const ADD_CHILD_NODE = gql`mutation AddChildNode(
  $nodeId: String,
  $sourceNodeId: String
) {
  insert_links(objects: {
    links_by_target: {data: {
      source_id: $sourceNodeId,
    }},
    id: $nodeId
  }) {
    returning {
      id
    }
  }
}`;

export const INSERT_LINK = gql`mutation InsertLink(
  $sourceId: String,
  $targetId: String,
  $id: String,
) {
  insert_links(objects: {
    source_id: $sourceId,
    target_id: $targetId,
    id: $id,
  }) {
    returning {
      id
    }
  }
}`;

export const DELETE_NODE = gql`mutation DeleteNode($id: String) {
  delete_links(where: {id: {_eq: $id}}) {
    returning {
      id
    }
  }
}`;
