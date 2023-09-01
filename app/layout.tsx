// ==============================================================
// RESOURCES
// ** FOR ENTIRE APP CONTEXTS
// _app.tsx -- from Next.js 12

'use client'

// ** Next
import { useRouter, usePathname } from 'next/navigation'

// ** React
import type { ReactNode } from 'react'
// import { useEffect } from 'react'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloProvider } from '@apollo/client'
import { client } from '#/lib/api/graphql/client'

// ** Redux Store
import { Provider as ReduxProvider } from 'react-redux'
import { store as reduxStore } from '#/lib/stores/redux'

// ** Contexts for User Authorization + Settings
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
// import { MaterialUIControllerProvider, useMaterialUIController, setMiniSidenav, setOpenConfigurator } from '#/lib/contexts'
import { SettingsProvider, SettingsConsumer } from '#/lib/contexts/settingsContext'
import ThemeComponent from '#/ui/theme/ThemeComponent'
import ThemeRegistry from '#/ui/theme/ThemeRegistry'

// ** Configs
// import '#/lib/config/i18n' // NOT YET SUPPORTED IN NEXT 13
// import { defaultACLObj } from '#/lib/config/acl'
import themeConfig from '#/lib/config/themeConfig'

// ** Layouts
import BlankLayout from '#/ui/layouts/BlankLayout' // this is your login layout
import UserLayout from '#/ui/layouts/UserLayout' // this is your main layout

// ** ~core Components (not needed anymore?)
// import WindowWrapper from '#/ui/window-wrapper'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** CSS Styles
import '#/styles/globals.css'
// import stylesGlobal from '#/styles/globals.module.css'
// import stylesDemo from '#/styles/demo/demo.module.css'
import '#/lib/threed/styles/index.css'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {layout.tsx}', ccm.green)
// console.debug('%c=======================================', ccm.black)

// ==============================================================
// TYPES + INTERFACES (TYPESCRIPT)

// interface WithRouterProps {
//   router: NextRouter
// }
// interface MyComponentProps extends WithRouterProps {
//   heyheyhey: string
// }

// ==============================================================
// MAIN APP

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
// ** ~CORE COMPONENTS (WRAPPERS/CONTEXTS)
// I DON'T BELIEVE WE NEED THIS ANYMORE
// const WindowWrapper = ({ children }: { children: ReactNode }): JSX.Element => {
//   // ** State
//   const [windowReadyFlag, setWindowReadyFlag] = useState(false)
//   const router = useRouter()

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       setWindowReadyFlag(true)
//     }
//   }, [router])

//   if (windowReadyFlag) {
//     return <>{children}</>
//   } else {
//     return null
//   }
// }
// ==============================================================
/** */

// ==============================================================
// ** Security Guard

const AuthConsumer = ({ children, authGuard, guestGuard }: any) => {
  if (!guestGuard && !authGuard) {
    // console.debug('%c📛 noGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <>{children}</>
    )
  }
  else if (authGuard) {
    // console.debug('%c🔱 authGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <AuthGuard fallback={<Spinner />}>
        {children}
      </AuthGuard>
    )
  }
  else if (guestGuard) {
    // console.debug('%c⚜ guestGuard loading...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      // <GuestGuard fallback={<Spinner />}>
      //   {children}
      // </GuestGuard>
      <AuthGuard fallback={<Spinner />}>
        {children}
      </AuthGuard>
    )
  }
  else {
    // console.debug('%c🔱 authGuard loading (by default)...', ccm.red)
    // console.debug('%c=======================================', ccm.black)
    return (
      <AuthGuard fallback={<Spinner />}>
        {children}
      </AuthGuard>
    )
  }
}

// ==============================================================
// ** Home Route
/*
// Set Home Forwarding (to First Page) URL, based on User Role
const getHomeRoute = (role: any) => {
  // user: acl: client: default main app index page
  if (role === 'client') {
    // return '/home'
    // return '/participate'
    return '/acl' // authorized credentials list? (boundary)
  }
  // user: acl: admin: default main app index page
  else if (role === 'admin') {
    // return '/' // this page (for testing. not ideal for production.)
    return '/home'
    return '/participate'
  }
  // user: acl: guest: default main app index page
  else {
    // special route requests
    // return '/' // this page (for testing. not ideal for production.)
    // if (! '/participate') {
      return '/auth/login'
    // }
    // else if ('/participate') {
    //   return '/participate'
    // }
  }

  // user: acl: unauthorized: default main app index page
  // default default default main app index page
  return '/auth/login'
  return '/'
}
*/
// ==============================================================
// ** Construct App using Function Component (Functional Noun)

// const App = (props: any) => {
// const App: FC<AppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayoutEmotion> = (props: any) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayout> = (props: any) => {
const RootLayout = ({ children }: { children: any }): JSX.Element => {
  // **
  // console.debug('RootLayout.children', children)

  // ** Props.children.props
  // const { props } = children

  // ** Hooks
  const auth = useAuth()
  /*
  const router = useRouter()
  const pathname = usePathname()

  // ** OnMount (+ optional return OnUnmount)
  // useEffect(() => {

    // user AUTHORIZED?
    if (auth.user && auth.user.role) {
      // get Home URL
      const homeRoute = getHomeRoute(auth.user.role)
      // console.debug('%c=======================================', ccm.black)
      console.debug('%c✅ user AUTHORIZED', ccm.lightgreen, auth.user, homeRoute)
      // console.debug('%c=======================================', ccm.black)

      // redirect user to Home URL
      // router.replace(homeRoute)
      router.push(homeRoute)
    }
    // user NOT AUTHORIZED!
    else {
      // get Home URL
      const homeRoute = getHomeRoute('unauthorized')
      // console.debug('%c=======================================', ccm.black)
      console.debug('%c❌ user NOT AUTHORIZED', ccm.red, auth.user, homeRoute)
      // console.debug('%c=======================================', ccm.black)

      // redirect user to their Home URL
      // if (props.childProp.segment !== 'auth') {
        // router.replace(homeRoute)
        // router.push(homeRoute)
      // }
    }

  // }, [])
  */
  // console.debug('%c🥕 auth', ccm.orange, auth)
  // console.debug('%c🥕 router', ccm.orange, router)
  // console.debug('%c🥕 children', ccm.orange, children)
  // console.debug('%c=======================================', ccm.black)

  // // destructure props for vars
  // // const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  // const { Component, pageProps } = props
  const Component = {
    getLayout: () => {},
    setConfig: () => {},
    authGuard: true,
    guestGuard: false,
    // acl: defaultACLObj
    acl: {
      action: 'manage',
      subject: 'all',
    },
  }

  // console.debug('%c🥕 props', ccm.orange, props)
  // console.debug('%c🥕 Component', ccm.black, Component)
  // console.debug('%c🥕 pageProps', ccm.black, pageProps)

  // ** PageComponent.Properties
  const getLayout = ({ children }: { children: any }): JSX.Element => {
    //
    // console.debug('getLayout.children', children)

    // const { props } = children

    // authorized: UserLayout
    // if (props.childProp.segment !== '' && props.childProp.segment !== 'auth') {
    if (auth.user && auth.user.role) {
      return (
        <div id='ThreeDAppLayout-UserLayout'>
          <UserLayout>
            {children}
          </UserLayout>
        </div>
      )
    }

    // default: BlankLayout
    else {
      return (
        <div id='ThreeDAppLayout-BlankLayout'>
          <BlankLayout>
            {children}
          </BlankLayout>
        </div>
      )
    }
  }
  const { setConfig, authGuard, guestGuard, acl } = Component // .setConfig ?? false
  // const authGuard = Component.authGuard ?? true
  // const guestGuard = Component.guestGuard ?? false
  // const acl = Component.acl ?? defaultACLObj

  // ** Return JSX
  return (
    <ThreeDAppProvider>
      <AuthProvider>
        <AuthConsumer
          authGuard={authGuard}
          guestGuard={guestGuard}
        >
          {/* <AclGuard
            aclAbilities={acl}
            guestGuard={guestGuard}
          > */}
            <ApolloProvider client={client}>
              <ReduxProvider store={reduxStore}>
                <SettingsProvider
                  { ...(setConfig ? { pageSettings: setConfig() } : { pageSettings: null }) }
                >
                  <SettingsConsumer>
                    {({ settings }) => (
                      <ThemeRegistry settings={settings}>
                        {/* <ThemeComponent settings={settings}> */}
                          {getLayout(
                              // <EthApp {...props}>
                                // <Component {...pageProps} />
                                {children}
                              // </EthApp>
                          )}
                        {/* </ThemeComponent> */}
                      </ThemeRegistry>
                    )}
                  </SettingsConsumer>
                </SettingsProvider>
              </ReduxProvider>
            </ApolloProvider>
          {/* </AclGuard> */}
        </AuthConsumer>
      </AuthProvider>
    </ThreeDAppProvider>
  )
}

export default RootLayout

/**
 * EXAMPLE from app-playground
 */
/*
import '#/styles/globals.css';
import { AddressBar } from '#/ui/AddressBar';
import { GlobalNav } from '#/ui/GlobalNav';
import { VercelLogo } from '#/ui/VercelLogo';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="[color-scheme:dark]">
      <head />
      <body className="overflow-y-scroll bg-gray-1100 bg-[url('/grid.svg')]">
        <GlobalNav />

        <div className="lg:pl-72">
          <div className="mx-auto max-w-4xl space-y-8 px-2 pt-20 lg:py-8 lg:px-8">
            <div className="rounded-lg bg-vc-border-gradient p-px shadow-lg shadow-black/20">
              <div className="rounded-lg bg-black">
                <AddressBar />
              </div>
            </div>

            <div className="rounded-lg bg-vc-border-gradient p-px shadow-lg shadow-black/20">
              <div className="rounded-lg bg-black p-3.5 lg:p-6">{children}</div>
            </div>

            <div className="rounded-lg bg-vc-border-gradient p-px shadow-lg shadow-black/20">
              <div className="rounded-lg bg-black">
                <Byline />
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

function Byline() {
  return (
    <div className="flex items-center justify-between space-x-4 p-3.5 lg:px-5 lg:py-3">
      <div className="flex items-center space-x-1.5">
        <div className="text-sm text-gray-600">By</div>
        <a href="https://vercel.com" title="Vercel">
          <div className="w-16 text-gray-300 hover:text-gray-50">
            <VercelLogo />
          </div>
        </a>
      </div>

      <div className="text-sm text-gray-600">
        <a
          className="underline decoration-dotted underline-offset-4 hover:text-gray-400"
          href="https://github.com/vercel/app-playground"
        >
          View code
        </a>
        {' or '}
        <a
          className="underline decoration-dotted underline-offset-4 hover:text-gray-400"
          href="https://vercel.com/templates/next.js/app-directory"
        >
          deploy your own
        </a>
      </div>
    </div>
  );
}
*/
