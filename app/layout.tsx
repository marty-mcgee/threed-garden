// ==============================================================
// RESOURCES
// ** DEFAULT APP LAYOUT -- TEMPLATE CHILD
// ?? FOR ENTIRE APP CONTEXTS ??

'use client'

// ** Next
import { useRouter, usePathname } from 'next/navigation'
// import type { GetServerSideProps, GetStaticProps } from 'next'
import { AppProps } from 'next/app'
// import { NextPageContext } from 'next'

// ** React
import type { ReactNode } from 'react'
import { useEffect } from 'react'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloProvider } from '@apollo/client'
import { client } from '#/lib/api/graphql/client'

// ** Redux Store
import { Provider as ReduxProvider } from 'react-redux'
import { store as reduxStore } from '#/lib/stores/redux'

// // ** Contexts for User Authorization + Settings
import { AuthProvider } from '#/lib/contexts/AuthContext'

// ** User Authorization Hook
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** User Authorization Guards/Boundaries (~CORE Components)
import AuthGuard from '#/ui/auth/AuthGuard'
// import GuestGuard from '#/ui/auth/GuestGuard'
// import AclGuard from '#/ui/auth/AclGuard'

// ** @Fake-DB (axios mock adapter)
import '#/lib/api/@fake-db'

// ** Contexts for Theme Settings + MUI Components
import { SettingsProvider, SettingsConsumer } from '#/lib/contexts/settings/SettingsContext'
import ThemeRegistry from '#/ui/theme/ThemeRegistry'

// ** Configs
// import '#/lib/config/i18n' // NOT YET SUPPORTED IN NEXT 13
// import { aclObjectDefault } from '#/lib/config/acl' // default has 'admin' privileges !!!
// import themeConfig from '#/lib/config/themeConfig'

// ** Layouts MOVED TO TEMPLATE.TSX
// import BlankLayout from '#/ui/layouts/BlankLayout' // this is your default and login layout
// import UserLayout from '#/ui/layouts/UserLayout' // this is your user-authorized (new dashboard) layout

// ** Helper Components
// import Spinner from '#/ui/components/spinner'

// ** CSS Styles
// import '#/ui/styles/globals.css'
// import stylesGlobal from '#/ui/styles/globals.module.css'
// import stylesDemo from '#/ui/styles/demo/demo.module.css'
// import '#/lib/threed/styles/index.css'
// import '#/lib/threed/styles/garden.module.css'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {layout.tsx}', ccm.lightgreen)
// console.debug('%c=======================================', ccm.black)

// ==============================================================

// // Set Home Forwarding (to First Page) URL, based on User Role
// const getHomeRoute = (role: any) => {
//   if (role === 'client') {
//     // return '/home' // another page
//     return '/participate' // another page
//     // return '/acl' // authorized credentials list? (boundary)
//   }
//   else if (role === 'admin') {
//     // return '/' // this page (for testing. not ideal for production.)
//     return '/home' // another page
//     // return '/participate' // another page
//   }
//   else {
//     // return '/' // this page (for testing. not ideal for production.)
//     return '/auth/login'
//   }
// }

// ==============================================================
// ** Security Guard MOVED TO TEMPLATE.TSX
/*
const AuthConsumer = ({ children, authGuard, guestGuard }: any) => {
  if (!guestGuard && !authGuard) {
    console.debug('%c📛 NoGuard loading... :(', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <AuthGuard fallback={<Spinner />}>
        <>{children}</>
      </AuthGuard>
    )
  }
  else if (authGuard) {
    console.debug('%c🔱 AuthGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <AuthGuard fallback={<Spinner />}>
        <>{children}</>
      </AuthGuard>
    )
  }
  else if (guestGuard) {
    console.debug('%c⚜ GuestGuard loading... :(', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      // <GuestGuard fallback={<Spinner />}>
      //   <>{children}</>
      // </GuestGuard>
      <AuthGuard fallback={<Spinner />}>
        <>{children}</>
      </AuthGuard>
    )
  }
  else {
    console.debug('%c🔱 AuthGuard loading BY DEFAULT... :(', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <AuthGuard fallback={<Spinner />}>
        <>{children}</>
      </AuthGuard>
    )
  }
}
*/

// ==============================================================
// MAIN APP TEMPLATE WRAPPER

// provide basic React Provider context node with props.children
// const ThreeDAppProvider: FC<{ children?: ReactNode }> = (props) => {
const ThreeDAppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // const { children } = props
  return (
    <html lang="en">
      <head />
      <body>
        <main id="ThreeDAppProvider">
          {children}
        </main>
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
const AppLayout = (
  { children }: { children: ReactNode },
  { Component, pageProps }: AppProps)
  : JSX.Element => {

  // **

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

  // // ** Hooks
  // const auth = useAuth()
  // const router = useRouter()
  // // const pathname = usePathname()

  // // ** OnMount (+ optional return OnUnmount)
  // useEffect(() => {
  //   // user AUTHORIZED?
  //   if (auth.user && auth.user.role) {
  //     // get Home URL
  //     const homeRoute = getHomeRoute(auth.user.role)
  //     console.debug('✅ user AUTHORIZED', auth.user, 'go to:', homeRoute)
  //     // redirect authorized user to Home URL
  //     // router.replace(homeRoute)
  //     router.push(homeRoute)
  //   }
  //   // user NOT AUTHORIZED!
  //   else {
  //     const homeRoute = getHomeRoute('unauthorized')
  //     console.debug('❌ user NOT AUTHORIZED', auth.user, 'go to:', homeRoute)
  //     // redirect un-authorized guest to Home URL
  //     // router.replace(homeRoute)
  //     router.push(homeRoute)
  //   }
  //   // return <><Spinner /></>
  // }, [router])

  // ** Return JSX
  return (
    <ThreeDAppProvider>
      <AuthProvider>
        {/* <AuthConsumer authGuard={authGuard} guestGuard={guestGuard}> */}
        <AuthGuard>
          {/* <AclGuard aclAbilities={acl} guestGuard={guestGuard}> */}
            <ApolloProvider client={client}>
              <ReduxProvider store={reduxStore}>
                {/* <SettingsProvider { ...(setConfig ? { pageSettings: setConfig() } : { pageSettings: null }) }> */}
                <SettingsProvider { ...({ pageSettings: null }) }>
                  <SettingsConsumer>
                    {({ settings }) => (
                      <ThemeRegistry settings={settings}>
                        {children}
                      </ThemeRegistry>
                    )}
                  </SettingsConsumer>
                </SettingsProvider>
              </ReduxProvider>
            </ApolloProvider>
          {/* </AclGuard> */}
        </AuthGuard>
        {/* </AuthConsumer> */}
      </AuthProvider>
    </ThreeDAppProvider>
  )
}

/* not working, for some reason
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
        acl: aclObjectDefault, // acl, {},
      },
    },
    revalidate: 10,
  }
}
*/

// deprecated
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

export default AppLayout
