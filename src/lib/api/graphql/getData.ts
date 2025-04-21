import { 
  stores,
  queries,
  // mutations,
} from '#/lib/api/graphql/apollo'
import {
  useApolloClient
} from '@apollo/client'

export default function getData (): void {
// export default function getData (client: any): Promise<void> {

  console.debug('getData: stores', stores)
  console.debug('getData: queries', queries)

  // ** NEED client for Apollo to connect
  const client = useApolloClient() // NO, this is a client hook
  console.debug('getData: client', client)

  const getPreferences = async() => await stores.preferencesStore.actions.loadFromDataSource(client)
  console.debug('getData: getPreferences', getPreferences)
  const showPreferences = async() => await stores.preferencesStore.store.get('one').data
  console.debug('getData: showPreferences', showPreferences)



  return
}
