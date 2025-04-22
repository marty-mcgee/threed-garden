'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  threedStore,
} from '#/lib/api/graphql/apollo'

// const GET_THREED = gql`
//   query GetThreeDs {
//     threeds {
//       id
//       title
//       doAutoRotate
//     }
//   }
// `
const GET_THREED = queries.GetThreeDs

export default function ThreeDs() {
  const { data } = useQuery(GET_THREED)
  console.debug('app: client threeds:', data)

  // Sync client-side data with the store
  if (data?.threeds?.nodes) {
    // threedStore.actions.setDoAutoRotate(data.threeds.doAutoRotate)
    console.debug('app: client threeds nodes:', data.threeds.nodes[0])
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {threedStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.threeds?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.threeds?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}