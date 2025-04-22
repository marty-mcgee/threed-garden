'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  participantStore,
} from '#/lib/api/graphql/apollo'

// const GET_PARTICIPANTS = gql`
//   query GetParticipants {
//     participants {
//       id
//       title
//       doAutoRotate
//     }
//   }
// `
const GET_PARTICIPANTS = queries.GetParticipants

export default function Participants() {
  const { data } = useQuery(GET_PARTICIPANTS)
  console.debug('app: client participants:', data)

  // Sync client-side data with the store
  if (data?.participants?.nodes) {
    // participantStore.actions.setDoAutoRotate(data.participants.doAutoRotate)
    console.debug('app: client participants nodes:', data.participants.nodes[0])
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {participantStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.participants?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.participants?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}