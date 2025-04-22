'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  projectStore,
} from '#/lib/api/graphql/apollo'

// const GET_PROJECTS = gql`
//   query GetProjects {
//     projects {
//       id
//       title
//     }
//   }
// `
const GET_PROJECTS = queries.GetProjects

export default function Projects() {
  const { data } = useQuery(GET_PROJECTS)
  console.debug('app: client projects:', data)

  // Sync client-side data with the store
  if (data?.projects?.nodes) {
    // projectStore.actions.setTitle(data.projects.title)
    console.debug('app: client projects nodes:', data.projects.nodes[0])
  }

  return (
    <div>
      {/* <p>Title: {projectStore.store.get('title') ? 'TITLE' : 'NO TITLE'}</p> */}
      <ol>
        {/* {data?.projects?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.projects?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}