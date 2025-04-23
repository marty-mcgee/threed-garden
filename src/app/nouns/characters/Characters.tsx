import { gql, useQuery } from '@apollo/client'

const GET_CHARACTERS = gql`
  query GetCharacters {
    characters {
      id
      title
    }
  }
`

const GET_CHARACTER_IMAGE = gql`
  query Character($title: String!) {
    character(title: $title) {
      id
      displayImage
    }
  }
`

function CharacterPhoto({ title }: { title: string }) {
  const { loading, error, data } = useQuery(GET_CHARACTER_IMAGE, {
    variables: { title },
  })

  if (loading) return null
  if (error) return `Error! ${error}`

  return (
    <img src={data.character.displayImage} style={{ height: 100, width: 100 }} />
  )
}

function CharactersList({ onCharacterSelected }: { onCharacterSelected: any }) {
  const { loading, error, data } = useQuery(GET_CHARACTERS)

  if (loading) return 'Loading...'
  if (error) return `Error! ${error.message}`

  return (
    <select name='character' onChange={onCharacterSelected}>
      {data.characters.map((character: any) => (
        <option key={character.id} value={character.title}>
          {character.title}
        </option>
      ))}
    </select>
  )
}

export default function Characters() {

  return (
    <div>
      {/* <CharactersList onCharacterSelected={null} /> */}
      {/* <CharacterPhoto title={'FarmerFemale'} /> */}
    </div>
  )
}