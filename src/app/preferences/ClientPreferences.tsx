// components/ClientPreferences.tsx
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
//       doAutoRotate
//     }
//   }
// `;
const GET_PREFERENCES = queries.GetPreferences

export default function ClientPreferences() {
  const { data } = useQuery(GET_PREFERENCES);
  console.debug('app: client preferences:', data)

  // Sync client-side data with the store
  if (data?.preferences) {
    // preferencesStore.actions.setDoAutoRotate(data.preferences.doAutoRotate);
  }

  return (
    <div>
      {/* <p>Auto-Rotate: {preferencesStore.store.get('doAutoRotate') ? 'ON' : 'OFF'}</p> */}
    </div>
  );
}