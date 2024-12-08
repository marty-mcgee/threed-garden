// ==============================================================
// TITLE: Apollo Client State+Store Wrapper

'use client'
// ^ this file needs the 'use client' pragma

// ==============================================================

import {
  ApolloLink,
  HttpLink,
  // getApolloContext
} from '@apollo/client'
import {
  ApolloNextAppProvider,
  InMemoryCache,
  ApolloClient,
  SSRMultipartLink,
} from '@apollo/experimental-nextjs-app-support'

// import { setVerbosity } from 'ts-invariant'
// setVerbosity('debug')

// [MM] COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug(`%c CCM TEST SUCCESS!!`, ccm.greenAlert)
// console.debug(`%c CCM TEST WHOOPSIES`, ccm.red)

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
  })

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
          ])
        : httpLink,
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
