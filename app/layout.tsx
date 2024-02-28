// 'use client'
// 'use server'
// ^ this file needs NO pragma

// ==============================================================
// RESOURCES
// ** DEFAULT APP LAYOUT -- TEMPLATE CHILD
// ?? FOR ENTIRE APP CONTEXTS ??

import { auth } from 'auth'
import { SessionProvider } from 'next-auth/react'

// ** Next
// import type { GetServerSideProps, GetStaticProps } from 'next'
import { AppProps } from 'next/app'
import { NextPageContext } from 'next'

// ** React
import type { ReactNode } from 'react'
import { Suspense } from 'react'

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
// import ObjectStateReference from '#/ui/dom'
// import AuthGuard from '#/ui/auth/AuthGuard'
// import GuestGuard from '#/ui/auth/GuestGuard'
// import AclGuard from '#/ui/auth/AclGuard'

// ** @Fake-DB (axios mock adapter)
import '#/lib/api/@fake-db'

// ** Contexts for Theme Settings + MUI Components
// import { SettingsProvider, SettingsConsumer } from '#/lib/contexts/settings/SettingsContext'
import ThemeRegistry from '#/ui/theme/ThemeRegistry'

// ** Configs
// import '#/lib/config/i18n' // NOT YET SUPPORTED IN NEXT 13
// import { aclObjectDefault } from '#/lib/config/acl' // default has 'admin' privileges !!!
// import themeConfig from '#/lib/config/themeConfig'

// ** Layouts
// import BlankLayout from '#/ui/layouts/BlankLayout' // this is your default and login layout
// import UserLayout from '#/ui/layouts/UserLayout' // this is your user-authorized (new dashboard) layout

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** CSS Styles
// import '#/ui/styles/globals.css'
// import stylesGlobal from '#/ui/styles/globals.module.css'
// import stylesDemo from '#/ui/styles/demo/demo.module.css'
// import '#/lib/threed/styles/index.css'
// import '#/lib/threed/styles/garden.module.css'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

import './globals.css'
// import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Footer from '@/components/footer'
import Header from '@/components/header'

const inter = Inter({ subsets: ['latin'] })

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
// console.debug('%c🥕 ThreeDGarden<FC,R3F>: {layout.tsx}', ccm.lightgreen)
// console.debug('%c=======================================', ccm.black)

// ==============================================================
// MAIN APP TEMPLATE WRAPPER

// provide basic React Provider context node with props.children
// const ThreeDAppProvider: FC<{ children?: ReactNode }> = (props) => {
const ThreeDAppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // const { children } = props
  return (
    <html lang='en'>
      <head />
      <body className={inter.className}>
        {children}
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

// const AppLayout = (
//   { children }: { children: ReactNode },
//   { Component, pageProps }: AppProps)
//   : JSX.Element => {

// const AppLayout = ({ children }: React.PropsWithChildren): JSX.Element => {
const AppLayout = async ({ children }: React.PropsWithChildren): Promise<JSX.Element> => {

  // **
  const session = await auth()
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
  // console.debug('🥕 QUERY: AppLayout.getClient.data', data)

  // // destructure props for vars
  // // const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  // const { Component, pageProps } = props
  // console.debug('🥕 PROPS: AppLayout.props.children', children)
  // console.debug('🥕 PROPS: AppLayout.props.Component', Component)
  // console.debug('🥕 PROPS: AppLayout.props.pageProps', pageProps)
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
  // console.debug('🥕 PROPS: AppLayout.props.children', children)
  // ** Props.children.props
  // const props2 = children.props
  // console.debug('🥕 PROPS: AppLayout.props.children.props', props2)

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

  // console.debug('%c🥕 PROPS: AppLayout.props', ccm.orange, props)
  // console.debug('%c🥕 PROPS: AppLayout.Component', ccm.black, Component)
  // console.debug('%c🥕 PROPS: AppLayout.pageProps', ccm.black, pageProps)

  // console.debug('%c=======================================', ccm.black)

  /* ** PageComponent.Properties MOVED TO TEMPLATE.TSX
  const getAppLayout = ({ children }: any): ReactNode => {
    //
    // const { children } = props
    // console.debug('🥕 PROPS: getAppLayout.props', props)
    // console.debug('🥕 PROPS: getAppLayout.props.children', children)
    // console.debug('%c=======================================', ccm.black)

    // authorized: UserLayout
    if ((auth.user && auth.user.role) ||
      (  children.props.childProp.segment !== ''
      && children.props.childProp.segment !== 'auth'  )) {
      return (
        <UserLayout key='ThreeDAppLayout-UserLayout'>
          <>{children}</>
        </UserLayout>
      )
    }

    // default: BlankLayout
    else {
      return (
        <BlankLayout key='ThreeDAppLayout-BlankLayout'>
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
                    {/* <SettingsConsumer> */}
                      {/* {({ settings }) => ( */}
                        {/* <ThemeRegistry settings={settings}> */}
                        <ThemeRegistry settings={{}}>
                          {/* <UserLayout key='ThreeDAppLayout-UserLayout'> */}
                          <SessionProvider session={session}>
                            {/* <>{children}</> */}
                            <ApolloClientWrapper>
                            {/* <ApolloProvider client={client}> */}

                            <Suspense fallback={<Spinner />}>
                              <div id='ThreeDAppProvider' className='flex flex-col justify-between w-full h-full min-h-screen'>
                                <Header />
                                <main className='flex-auto w-full px-2 py-1 mx-auto'>
                                  {children}
                                </main>
                                <Footer />
                              </div>
                            </Suspense>


                            {/* </ApolloProvider> */}
                            </ApolloClientWrapper>
                          </SessionProvider>
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

export default AppLayout

/* not working, no longer supported in Next 14 SSR
AppLayout.getInitialProps = async (ctx: NextPageContext) => {
//   const res = await fetch('https://api.github.com/repos/vercel/next.js')
//   const json = await res.json()
//   return { stars: json.stargazers_count }
// }
// export async function getServerSideProps() {
// export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
// export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  // const allPosts = await getAllPostsForHome(preview)
  // console.debug('getServerSideProps on AppLayout')
  console.debug('getInitialProps on AppLayout')
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
// AppLayout.defaultProps = {
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
