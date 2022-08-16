// @flow

import { gql } from '../../packages/gql/use';

export const QUERY_NODES = gql`
query {
  links {
    id
    links_by_source {
      id
      source_id
      target_id
      links_indexes_by_index_in {
        depth
        id
        index_in_id
        index_of_id
        list_id
        list_of_id
      }
    }
    links_by_target {
      id
      source_id
      target_id
      links_indexes_by_index_in {
        depth
        id
        index_in_id
        index_of_id
        list_id
        list_of_id
      }
    }
    links_indexes_by_index_of {
      id
      depth
      index_in_id
      index_of_id
      list_id
      list_of_id
    }
    links_indexes_by_list_of {
      depth
      id
      index_in_id
      index_of_id
      list_id
      list_of_id
    }
  }
}
`;

export const QUERY_LINKS = gql`
query {
  links {
    id
    source_id
    target_id
    target {
      id
      links_indexes_by_index_of {
        id
        depth
        index_in_id
        index_of_id
        list_id
        list_of_id
      }
      links_indexes_by_list_of {
        depth
        id
        index_in_id
        index_of_id
        list_id
        list_of_id
      }
    }
    links_indexes_by_index_in {
      id
      depth
      index_in_id
      index_of_id
      list_id
      list_of_id
    }
    source {
      id
      links_indexes_by_index_of {
        id
        depth
        index_in_id
        index_of_id
        list_id
        list_of_id
      }
      links_indexes_by_list_of {
        depth
        id
        index_in_id
        index_of_id
        list_id
        list_of_id
      }
    }
  }
}
`;

export const QUERY_LINKS_INDEXES = gql`
query {
  links_indexes {
    depth
    id
    index_in_id
    index_of_id
    list_id
    list_of_id
    index_in {
      id
      source_id
      target_id
    }
    index_of {
      id
    }
    list_of {
      id
    }
  }
}
`;

export const INSERT_LINK = gql`
  mutation InsertLink(
    $sourceId: String,
    $targetId: String,
  ) {
    insert_links(objects: {
      source_id: $sourceId,
      target_id: $targetId,
    }) {
      returning {
        id
      }
    }
  }
`;

export const DELETE_LINK = gql`
  mutation DELETE_LINK($linkId: String) {
    delete_links(where: {id: {_eq: $linkId}}) {
      returning {
        id
      }
    }
  }
`;

export const INSERT_NODE = gql`
  mutation INSERT_NODE($objects: [links_insert_input!]!) {
    node: insert_links(objects: $objects) {
      returning {
        id
      }
    }
  }
`;

export const DELETE_NODE = gql`
  mutation DELETE_NODE($nodeId: String) {
    delete_links(where: {id: {_eq: $nodeId}}) {
      returning {
        id
      }
    }
  }
`;
