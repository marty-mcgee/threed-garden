'use client'
// ^ this file needs the 'use client' pragma

import {
  ApolloLink,
  HttpLink,
  // getApolloContext
} from '@apollo/client'
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  NextSSRApolloClient,
  SSRMultipartLink,
} from '@apollo/experimental-nextjs-app-support/ssr'

// import { setVerbosity } from 'ts-invariant'
// setVerbosity('debug')

// [MM] COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug(`%c CCM TEST SUCCESS!!`, ccm.orange)
// console.debug(`%c CCM TEST WHOOPSIES`, ccm.red)

const uri_gql = process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL  // 'https://threed.design/graphql'
const uri_rest = process.env.NEXT_PUBLIC_WP_REST_API_URL    // 'https://threed.design/wp-json/wp/v2'
// console.clear()
console.debug('%c🥕 ThreeD Garden 🌱 ... 🦆 apollo loaded 🍄', ccm.lightgray)
console.debug('%c🦆 - GQL API', ccm.darkgreen, uri_gql)
// console.debug('%c🦆 - REST API', ccm.darkgreen, uri_rest)
console.debug('%c=======================================================', ccm.green)

// have a function to create a client for you
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
  return new NextSSRApolloClient({
    // use the `NextSSRInMemoryCache`, not the normal `InMemoryCache`
    cache: new NextSSRInMemoryCache(),
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

// you need to create a component to wrap your app in
export function ApolloClientWrapper({ children }: React.PropsWithChildren) {
  // ** makeClient()
  console.debug('%c🦆 ApolloClientWrapper makeClient()', ccm.greenAlert, makeClient())
  return (
    // <ApolloNextAppProvider makeClient={makeClient} apolloContext={apolloContext}>
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  )
}
