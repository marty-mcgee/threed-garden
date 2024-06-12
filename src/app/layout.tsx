// 'use client'
'use server'
// ^ this file should need NO pragma: default is 'use server'

// ==============================================================
// RESOURCES
// ** DEFAULT APP LAYOUT -- TEMPLATE CHILD
// ?? FOR ENTIRE APP CONTEXTS ??

// import { auth } from 'auth'
// import { SessionProvider } from 'next-auth/react'

// ** Next
// import type { GetServerSideProps, GetStaticProps } from 'next'
// import { AppProps } from 'next/app'
// import { NextPageContext } from 'next'
import dynamic from 'next/dynamic'

// ** React
import type { ReactNode } from 'react'
// import { Suspense } from 'react'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloClientWrapper } from '#/lib/api/graphql/ApolloClientWrapper'
// import { ApolloProvider } from '@apollo/__client'
// import { client } from '#/lib/api/graphql/__client'
// import { getClient } from '#/lib/api/graphql/__client'
// import { stores, queries, mutations } from '#/lib/stores/apollo'

// ** Redux Store
// import { Provider as ReduxProvider } from 'react-redux'
// import { store as reduxStore } from '#/lib/stores/redux'

// // ** Contexts for User Authorization + Settings
// import { AuthProvider } from '#/lib/contexts/AuthContext'

// ** User Authorization Hook
// import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** User Authorization Guards/Boundaries (~CORE Components)
// import ObjectStateReference from '#/layout/ui/dom'
// import AuthGuard from '#/layout/ui/auth/AuthGuard'
// import GuestGuard from '#/layout/ui/auth/GuestGuard'
// import AclGuard from '#/layout/ui/auth/AclGuard'

// ** @Fake-DB (axios mock adapter)
// import '#/lib/api/@fake-db'

// ** Contexts for Theme Settings + MUI Components
// import { SettingsProvider, SettingsConsumer } from '#/lib/contexts/settings/SettingsContext'
import ThemeRegistry from '#/layout/ui/theme/ThemeRegistry'

// ** Configs
// import '#/lib/config/i18n' // NOT YET SUPPORTED IN NEXT 13
// import { aclObjectDefault } from '#/lib/config/acl' // default has 'admin' privileges !!!
// import themeConfig from '#/lib/config/themeConfig'

// ** Layouts
// import BlankLayout from '#/layout/ui/layouts/BlankLayout' // this is your default and login layout
// import UserLayout from '#/layout/ui/layouts/UserLayout' // this is your user-authorized (new dashboard) layout

// ** CSS Styles
import '#/layout/styles/globals.css' // global tailwind css
import '#/layout/styles/styles.css' // additional global basic css

// ** LAYOUT Components (Head, Main, Foot)
// import { SessionWrapper } from '#/layout/SessionWrapper'
const SessionWrapper = dynamic(() => import('~/src/layout/SessionWrapper'), { ssr: false })
// import Header from '#/layout/header'
// import Footer from '#/layout/footer'
// // const Header = dynamic(() => import('#/layout/header').then((mod) => mod), { ssr: false })
// // const Footer = dynamic(() => import('#/layout/footer').then((mod) => mod), { ssr: false })
const Header = dynamic(() => import('#/layout/header'), { ssr: false })
const Footer = dynamic(() => import('#/layout/footer'), { ssr: false })

// ** FONTS ??
// import { Inter } from 'next/font/google' // Roboto?
// ** set google font 'inter'national css
// const inter = Inter({ subsets: ['latin'] })
// const roboto = Roboto({ weight: '400', subsets: ['latin'] })

// ** Helper Components
// import Spinner from '#/layout/ui/components/spinner'
// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {layout.tsx}', ccm.lightgreen)
// console.debug('%c=======================================', ccm.black)

// ==============================================================
// MAIN APP TEMPLATE WRAPPER

// basic React Provider context node with props.children
// const ThreeDAppProvider: FC<{ children?: ReactNode }> = (props) => {
const ThreeDAppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // **
  return (
    <html lang='en'>{/* className='antialiased' */}
      <head />
      <body>
      {/* <body className={inter.className}> */}
      {/* <body className={inter.className + ' ' + roboto.className + ' ' + roboto.style.fontFamily}> */}
        <SessionWrapper>
          <div id='ThreeDApp'>
            {children}
          </div>
        </SessionWrapper>
      </body>
    </html>
  )
}

// ==============================================================
// ** Construct App using Function Component (Functional Noun)
// **
// EXAMPLE: simple
// function MyApp({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />
// }
// export default MyApp
// **
// EXAMPLES: testing
// const App = (props: any) => {
// const App: FC<AppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayoutEmotion> = (props: any) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayout> = (props: any) => {

// const RootLayout = (
//   { children }: { children: ReactNode },
//   { Component, pageProps }: AppProps)
//   : JSX.Element => {

const RootLayout = ({ children }: React.PropsWithChildren): JSX.Element => {
// const RootLayout = async ({ children }: React.PropsWithChildren): Promise<JSX.Element> => {

  // ** threed.session
  // let session = {
  //   user: {
  //     name: 'string',
  //     email: 'string',
  //     image: 'string',
  //   },
  //   expires: new Date().getDate() // 'datetime as type date or string?'
  // }
  // const session = await auth()
  // const session = auth()
  // if (session?.user) {
  //   // @ ts-expect-error TODO: Look into https://react.dev/reference/react/experimental_taintObjectReference
  //   // filter out sensitive data before passing to client.
  //   session.user = {
  //     name: session.user.name,
  //     email: session.user.email,
  //     image: session.user.image,
  //   }
  // }

  // const { data } = await getClient().query({ query: queries.GetProjects })
  // console.debug('🥕 QUERY: RootLayout.getClient.data', data)

  // // destructure props for vars
  // // const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  // const { Component, pageProps } = props
  // console.debug('🥕 PROPS: RootLayout.props.children', children)
  // console.debug('🥕 PROPS: RootLayout.props.Component', Component)
  // console.debug('🥕 PROPS: RootLayout.props.pageProps', pageProps)
  // EXAMPLE: props.Component ??
  // const Component = {
  //   getLayout: () => {},
  //   setConfig: () => {},
  //   authGuard: true,
  //   guestGuard: false,
  //   // default acl is 'admin' privileges !!!
  //   // acl: aclObjectDefault
  //   acl: {
  //     action: 'manage',
  //     subject: 'all',
  //   },
  // }

  // ** Props.children
  // const { children } = props
  // console.debug('🥕 PROPS: RootLayout.props.children', children)
  // ** Props.children.props
  // const props2 = children.props
  // console.debug('🥕 PROPS: RootLayout.props.children.props', props2)

  // // ** Hooks
  // const auth = useAuth()
  // // console.debug('%c🔑 auth', ccm.orange, auth)
  // // console.debug('%c🔑 auth.user', ccm.orange, auth.user)

  // // const { authGuard, guestGuard, acl } = Component // getLayout, setConfig,
  // let authGuard = true
  // let guestGuard = true
  // let acl = {} // aclObjectDefault // admin priveleges by default, currently
  // // const authGuard = Component?.authGuard ?? false
  // // const guestGuard = Component?.guestGuard ?? false
  // // const acl = Component?.acl ?? aclObjectDefault

  // console.debug('%c🥕 PROPS: RootLayout.props', ccm.orange, props)
  // console.debug('%c🥕 PROPS: RootLayout.Component', ccm.black, Component)
  // console.debug('%c🥕 PROPS: RootLayout.pageProps', ccm.black, pageProps)

  // console.debug('%c=======================================', ccm.black)

  /* ** PageComponent.Properties MOVED TO TEMPLATE.TSX
  const getRootLayout = ({ children }: any): ReactNode => {
    //
    // const { children } = props
    // console.debug('🥕 PROPS: getRootLayout.props', props)
    // console.debug('🥕 PROPS: getRootLayout.props.children', children)
    // console.debug('%c=======================================', ccm.black)

    // authorized: UserLayout
    if ((auth.user && auth.user.role) ||
      (  children.props.childProp.segment !== ''
      && children.props.childProp.segment !== 'auth'  )) {
      return (
        <UserLayout key='ThreeDRootLayout-UserLayout'>
          <>{children}</>
        </UserLayout>
      )
    }

    // default: BlankLayout
    else {
      return (
        <BlankLayout key='ThreeDRootLayout-BlankLayout'>
          <>{children}</>
        </BlankLayout>
      )
    }
  }
  */

  // ** Return JSX
  return (
    <ThreeDAppProvider>
      {/* <ObjectStateReference> */}
        {/* <AuthProvider> */}
          {/* <AuthConsumer authGuard={authGuard} guestGuard={guestGuard}> */}
          {/* <AuthGuard> */}
            {/* <AclGuard aclAbilities={acl} guestGuard={guestGuard}> */}
              {/* <ApolloProvider client={client}> */}
                {/* <ReduxProvider store={reduxStore}> */}
                  {/* <SettingsProvider { ...(setConfig ? { pageSettings: setConfig() } : { pageSettings: null }) }> */}
                  {/* <SettingsProvider { ...({ pageSettings: null }) }> */}
                  {/* <SettingsProvider pageSettings={{}}> */}
                    {/* <SettingsConsumer> */}
                      {/* {({ settings }) => ( */}
                        <ThemeRegistry settings={{}}>
                        {/* <ThemeRegistry settings={{}}> */}
                          {/* <UserLayout key='ThreeDRootLayout-UserLayout'> */}

                            <ApolloClientWrapper>
                            {/* <ApolloProvider client={client}> */}

                              {/* <SessionProvider session={session}> */}
                              {/* <SessionProvider session={null}> */}

                                {/* <Suspense fallback={<Spinner />}> */}
                                <div 
                                  id='ThreeDAppLayout'
                                  // className='
                                  //   flex 
                                  //   flex-col 
                                  //   justify-between 
                                  //   w-full 
                                  //   h-full 
                                  //   min-h-screen
                                  // '
                                >
                                  <Header 
                                    // key='ThreeDAppHeader'
                                  />

                                  <main 
                                    id='ThreeDAppMain'
                                    // key='ThreeDAppMain'
                                    // className='
                                    //   flex-auto 
                                    //   w-full 
                                    //   h-full
                                    //   px-2 
                                    //   py-1 
                                    //   mx-auto
                                    // '
                                  >
                                    {children}
                                  </main>

                                  {/* <Footer
                                    // key='ThreeDAppFooter'
                                  /> */}
                                </div>
                                {/* </Suspense> */}

                              {/* </SessionProvider> */}

                            {/* </ApolloProvider> */}
                            </ApolloClientWrapper>

                          {/* </UserLayout> */}
                        </ThemeRegistry>
                      {/* )} */}
                    {/* </SettingsConsumer> */}
                  {/* </SettingsProvider> */}
                {/* </ReduxProvider> */}
              {/* </ApolloProvider> */}
            {/* </AclGuard> */}
          {/* </AuthGuard> */}
          {/* </AuthConsumer> */}
        {/* </AuthProvider> */}
      {/* </ObjectStateReference> */}
    </ThreeDAppProvider>
  )
}

export default RootLayout

// ** NOTES

/* not working, no longer supported in Next 14 SSR
RootLayout.getInitialProps = async (ctx: NextPageContext) => {
//   const res = await fetch('https://api.github.com/repos/vercel/next.js')
//   const json = await res.json()
//   return { stars: json.stargazers_count }
// }
// export async function getServerSideProps() {
// export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
// export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  // const allPosts = await getAllPostsForHome(preview)
  // console.debug('getServerSideProps on RootLayout')
  console.debug('getInitialProps on RootLayout')
  return {
    props: {
      Component: {
        getLayout: 'HEY HEY HEY',
        setConfig: 'true',
        authGuard: false,
        guestGuard: true,
        acl: {}, // aclObjectDefault, acl, {},
      },
    },
    revalidate: 10,
  }
}
*/

// deprecated OLD NEXT 10
// RootLayout.defaultProps = {
//   Component: {
//     getLayout: 'YO YO YO',
//     setConfig: 'true',
//     authGuard: false,
//     guestGuard: true,
//     acl: aclObjectDefault, // acl, {},
//   },
//   getLayout: 'HEY HEY HEY',
//   setConfig: 'true',
//   authGuard: false,
//   guestGuard: true,
//   acl: aclObjectDefault, // acl, {},
// }
