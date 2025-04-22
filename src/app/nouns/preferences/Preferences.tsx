'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  preferencesStore,
} from '#/lib/api/graphql/apollo'

// const GET_PREFERENCES = gql`
//   query GetPreferences {
//     preferences {
//       id
//       title
//       doAutoRotate
//     }
//   }
// `
const GET_PREFERENCES = queries.GetPreferences

export default function Preferences() {
  const { data } = useQuery(GET_PREFERENCES)
  // console.debug('app: client preferences:', data)

  // Sync client-side data with the store
  if (data?.preferencess?.nodes) {
    // preferencesStore.actions.setDoAutoRotate(data.preferences.doAutoRotate)
    console.debug('app: client preferencess nodes:', data.preferencess.nodes[0])
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {preferencesStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.preferencess?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.preferencess?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
    </div>
  )
}