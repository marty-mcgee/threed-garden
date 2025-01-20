// ==============================================================
// TITLE: Apollo Client State+Store Wrapper

'use client'
// ^ this file needs the 'use client' pragma

// ==============================================================

// ** APOLLO Imports
import {
  ApolloLink,
  HttpLink,
  // getApolloContext
} from '@apollo/client'
import { 
  setContext 
} from '@apollo/client/link/context'
import {
  ApolloNextAppProvider,
  InMemoryCache,
  ApolloClient,
  SSRMultipartLink,
} from '@apollo/experimental-nextjs-app-support'

// ** HELPER Imports
import ccm from '#/lib/utils/console-colors'
// import { setVerbosity } from 'ts-invariant'
// setVerbosity('debug')

// ==============================================================

// ** APP VERSION
// const appVersion: string = 'v0.17.0'
const appVersion: string = require('package.json').version

// ** API ENDPOINTS
const uri_gql: string = process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL  // 'https://threed.design/graphql'
const uri_rest: string = process.env.NEXT_PUBLIC_WP_REST_API_URL    // 'https://threed.design/wp-json/wp/v2'

// ** DEBUGGING + TESTING
const debug: boolean = false

if (debug) {
  // console.clear()
  console.debug('%c=========================================', ccm.darkgreen)
  console.debug('%c🥕 ThreeD Garden 🌱 Apollo loaded 🍄', ccm.darkgreen)
  console.debug('%c🌱 - appVersion', ccm.darkgreen, appVersion)
  console.debug('%c🦆 - GQL API', ccm.darkgreen, uri_gql)
  console.debug('%c🦉 - REST API', ccm.darkgreen, uri_rest)
  console.debug('%c=========================================', ccm.darkgreen)
}

// ==============================================================

// create a state+store client
function makeClient() {
  // **
  const httpLink = new HttpLink({
    // this needs to be an absolute url, as relative urls cannot be used in SSR
    uri: uri_gql,
    // uri: uri_rest,
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = 'force-static'`)
    fetchOptions: { cache: 'no-store' },
    // you can override the default `fetchOptions` on a per query basis
    // via the `context` property on the options passed as a second argument
    // to an Apollo Client data fetching hook, e.g.:
    // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { cache: 'force-cache' }}})
    
    headers: {
      authorization: localStorage.getItem('token'),
      // 'client-name': 'ThreeD Garden [web]',
      // 'client-version': '0.0.0'
    }
  })

  // ** AUTH
  // const authLink = setContext((_, { headers }) => {
  //   // get the authentication token from local storage if it exists
  //   // const token = localStorage.getItem('token')
  //   // const token = process.env.GRAPHQL_JWT_TOKEN // NO!
  //   // return the headers to the context so httpLink can read them
  //   return {
  //     headers: {
  //       ...headers,
  //       // authorization: token ? `Bearer ${token}` : '',
  //       authorization: token ? token : '',
  //     }
  //   }
  // })

  // **
  return new ApolloClient({
    // using the nextjs-support `InMemoryCache`, not the normal apollo `InMemoryCache`
    cache: new InMemoryCache(),
    connectToDevTools: true,
    link:
      typeof window === 'undefined'
        ? ApolloLink.from([
          // in a SSR environment, if you use multipart features like
          // @defer, you need to decide how to handle these.
          // This strips all interfaces with a `@defer` directive from your queries.
          new SSRMultipartLink({
            stripDefer: true,
          }),
          httpLink,
          // authLink.concat(httpLink),
        ])
      : httpLink,
      // : authLink.concat(httpLink),

    // Enable sending cookies over cross-origin requests
    credentials: 'include', // same-origin | never | include (cross-origin)

    // headers: {
    //   // authorization: localStorage.getItem('token'),
    //   // 'client-name': 'ThreeD Garden [web]',
    //   // 'client-version': '0.0.0'
    // }
  })
}

// component to wrap the app
// export function ApolloClientWrapper({ children }: React.PropsWithChildren) {
export function ApolloClientWrapper({ children }: { children: any }) {
  // ** makeClient()
  // const madeClient = makeClient()
  // console.debug('%c🦆 ApolloClientWrapper makeClient() => madeClient', ccm.greenAlert, madeClient) // ApolloClient
  // console.debug('%c🦆 ApolloClientWrapper madeClient.cache', ccm.greenAlert, madeClient.cache) // ApolloClient.cache
  // console.debug('%c🦆 ApolloClientWrapper madeClient.query', ccm.greenAlert, madeClient.query) // ApolloClient.query GetPreferences
  // **
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  )
}
