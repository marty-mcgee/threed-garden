'use client'

import { 
  gql, 
  useQuery,
} from '@apollo/client'
import { 
  // stores,
  queries,
  characterStore,
} from '#/lib/api/graphql/apollo'

// const GET_CHARACTERS = gql`
//   query GetCharacters {
//     characters {
//       id
//       title
//     }
//   }
// `

// const GET_CHARACTER_IMAGE = gql`
//   query Character($title: String!) {
//     character(title: $title) {
//       id
//       displayImage
//     }
//   }
// `

// function CharacterPhoto({ title }: { title: string }) {
//   const { loading, error, data } = useQuery(GET_CHARACTER_IMAGE, {
//     variables: { title },
//   })

//   if (loading) return null
//   if (error) return `Error! ${error}`

//   return (
//     <img src={data.character.displayImage} style={{ height: 100, width: 100 }} />
//   )
// }

// function CharactersList({ onCharacterSelected }: { onCharacterSelected: any }) {
//   const { loading, error, data } = useQuery(GET_CHARACTERS)

//   if (loading) return 'Loading...'
//   if (error) return `Error! ${error.message}`

//   return (
//     <select name='character' onChange={onCharacterSelected}>
//       {data.characters.map((character: any) => (
//         <option key={character.id} value={character.title}>
//           {character.title}
//         </option>
//       ))}
//     </select>
//   )
// }

export default function Characters() {
  // const { data } = useQuery(GET_CHARACTERS)
  const { data } = useQuery(queries.GetCharacters)
  console.debug('app: client characters:', data)

  // Sync client-side data with the store
  if (data?.characters?.nodes) {
    // characterStore.actions.setDoAutoRotate(data.characters.doAutoRotate)
    console.debug('app: client characters nodes:', data.characters.nodes[0])
  }

  return (
    <div>
      <ol>
        {/* {data?.characters?.nodes[0].map(item => <Item key={item.id} id={item.id}/>)} */}
        {data?.characters?.nodes.map((item: any) => <li key={item.id}>{item.title}</li>)}
      </ol>
      {/* <CharactersList onCharacterSelected={null} /> */}
      {/* <CharacterPhoto title={'FarmerFemale'} /> */}
    </div>
  )
}