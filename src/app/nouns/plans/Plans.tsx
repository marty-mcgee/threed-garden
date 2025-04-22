'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  planStore,
} from '#/lib/api/graphql/apollo'

// const GET_PLANS = gql`
//   query GetPlans {
//     plans {
//       id
//       title
//       doAutoRotate
//     }
//   }
// `
const GET_PLANS = queries.GetPlans

export default function Plans() {
  const { data } = useQuery(GET_PLANS)
  console.debug('app: client plans:', data)

  // Sync client-side data with the store
  if (data?.plans?.nodes) {
    // planStore.actions.setDoAutoRotate(data.plans.doAutoRotate)
    console.debug('app: client plans nodes:', data.plans.nodes[0])
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {planStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.plans?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.plans?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}