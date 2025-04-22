'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  farmbotStore,
} from '#/lib/api/graphql/apollo'

// const GET_FARMBOTS = gql`
//   query GetFarmBots {
//     farmbots {
//       id
//       title
//       doAutoRotate
//     }
//   }
// `
const GET_FARMBOTS = queries.GetFarmBots

export default function FarmBots() {
  const { data } = useQuery(GET_FARMBOTS)
  console.debug('app: client farmbots:', data)

  // Sync client-side data with the store
  if (data?.farmbots?.nodes) {
    // farmbotStore.actions.setDoAutoRotate(data.farmbots.doAutoRotate)
    console.debug('app: client farmbots nodes:', data.farmbots.nodes[0])
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {farmbotStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.farmbots?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.farmbots?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}