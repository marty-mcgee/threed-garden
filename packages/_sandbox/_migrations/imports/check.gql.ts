import gql from 'graphql-tag';

export const CHECK = gql`
query {
  links {
    id
    links_by_source {
      id
      source_id
      type
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
      type
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
  links {
    id
    source_id
    target_id
    type
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
      type
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
`