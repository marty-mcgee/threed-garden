'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { 
  // stores,
  queries,
  userStore,
} from '#/lib/api/graphql/apollo'

// const GET_USERS = gql`
//   query GetUsers {
//     users {
//       id
//       name
//       username
//     }
//   }
// `
const GET_USERS = queries.GetUsers

export default function Users() {
  const { data } = useQuery(GET_USERS)
  console.debug('app: client users:', data)

  // Sync client-side data with the store
  if (data?.users?.nodes) {
    // userStore.actions.setDoAutoRotate(data.users.username)
    console.debug('app: client users nodes:', data.users.nodes)
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {userStore.store.get('username') ? 'ON' : 'OFF'}</p> */}
      <ol>
        {/* {data?.users?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.users?.nodes.map((item: any) => <li key={item.id}>{item.name}</li>)}
      </ol>
    </div>
  )
}