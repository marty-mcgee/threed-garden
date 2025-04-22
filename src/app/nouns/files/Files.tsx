'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  fileStore,
} from '#/lib/api/graphql/apollo'

// const GET_FILES = gql`
//   query GetFiles {
//     files {
//       id
//       title
//       doAutoRotate
//     }
//   }
// `
const GET_FILES = queries.GetFiles

export default function Files() {
  const { data } = useQuery(GET_FILES)
  console.debug('app: client files:', data)

  // Sync client-side data with the store
  if (data?.files?.nodes) {
    // fileStore.actions.setDoAutoRotate(data.files.doAutoRotate)
    console.debug('app: client files nodes:', data.files.nodes[0])
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {fileStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.files?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.files?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}