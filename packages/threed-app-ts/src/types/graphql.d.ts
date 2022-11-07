// handle .graphql files
declare module '*.graphql' {
  import { DocumentNode } from 'graphql'

  const Schema: DocumentNode

  export = Schema
}
// handle .gql files
declare module '*.gql' {
  import { DocumentNode } from 'graphql'

  const Schema: DocumentNode

  export = Schema
}
