// ** Import React stuff
import { FunctionComponent } from 'react'

// ** Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"

// GET CLIENT FROM CONTEXT PROVIDER !!!
// import { client } from '~/api/graphql/client'
// console.debug('APOLLO CLIENT HTTP', client)

// ** Import Apollo stuff
import { useApolloClient } from '@apollo/client'

type Data = {
  word: string,
  // client: ApolloClient<NormalizedCacheObject>
}

function SomeComponent() {
  const client = useApolloClient()
  // `client` is now set to the `ApolloClient` instance being used by the
  // application (that was configured using something like `ApolloProvider`)
  // console.debug('APOLLO CLIENT HTTP', client)
}

const Handler = (req: NextApiRequest, res: NextApiResponse<Data>) => {

  const word = "[MM] HEY HEY HEY -- apollo client Handler (from local node server (next))"
  console.debug('APOLLO CLIENT HTTP (api page/Handler) req', req)
  console.debug('APOLLO CLIENT HTTP (api page/Handler) Data', word)

  res.status(200).json({ word: word }) // , client: JSON.stringify(client)
  console.debug('APOLLO CLIENT HTTP (api page/Handler) res', res)

  // return ??
}

export default Handler
