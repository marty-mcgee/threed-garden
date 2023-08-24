// simple try:catch promise
try {
  console.debug('threed servers/apollo.js loaded')

  const doBootApollo = true

  if (doBootApollo) {
    const { ApolloServer } = require('apollo-server')
    const gql = require('graphql-tag')

    const typeDefs = gql`
      type Query {
        word: String
      }
    `

    const resolvers = {
      Query: {
        word: () => 'HEY HEY HEY',
      },
    }

    const schema = new ApolloServer({ typeDefs, resolvers })

    schema.listen({ port: process.env.PORT }).then(({ url }) => {
      console.debug(`schema ready at ${url}`)
    })
  }
} catch (err) {
  // an error has occurred. no output is being attempted here.
  console.debug('threed servers/apollo.js not loaded', err)
}
