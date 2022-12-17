// ==============================================================
// RESOURCES
// ** FOR ENTIRE APP CONTEXTS
// _app.tsx -- from Next.js 12

'use client'

// ** Next
// import { useRouter } from 'next/navigation'

// ** React
// import { useState, useEffect, ReactNode } from 'react'
import type { ReactNode } from 'react'

// ** Apollo Client -- State Management using Cache/Store (via GraphQL)
import { ApolloProvider } from '@apollo/client'
import { client } from '#/lib/api/graphql/client'

// ** Redux Store
import { Provider as ReduxProvider } from 'react-redux'
import { store as reduxStore } from '#/lib/stores/redux'

// ** Contexts for User Authorization + Settings
import { AuthProvider } from '#/ui/context/AuthContext'

// ** Contexts for Theme Settings + MUI Components
import { SettingsProvider, SettingsConsumer } from '#/ui/context/settingsContext'
import ThemeComponent from '#/ui/theme/ThemeComponent'

// ** Configs
// import '#/lib/config/i18n' // NOT YET SUPPORTED IN NEXT 13
import { defaultACLObj } from '#/lib/config/acl'
import themeConfig from '#/lib/config/themeConfig'

// ** Layouts
import BlankLayout from '#/ui/layouts/BlankLayout' // this is your login layout
import UserLayout from '#/ui/layouts/UserLayout' // this is your main layout

// ** ~core Components
// import WindowWrapper from '#/ui/components/window-wrapper'

// ** CSS Styles
import '#/styles/globals.css'
// import stylesGlobal from '#/styles/globals.module.css'
// import stylesDemo from '#/styles/demo/demo.module.css'
import '#/lib/threed/styles/index.css'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
console.debug('%c=======================================', ccm.black)
console.debug('%c🥕 ThreeDGarden<FC,R3F>: {layout.tsx}', ccm.green)
console.debug('%c=======================================', ccm.black)

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
// const ThreeDProvider: FC<{ children?: ReactNode }> = (props) => {
const ThreeDProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // const { children } = props

  return (
    <html lang="en">
      <head />
      <body>
        <main id="ThreeDProvider">
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
// ** Construct App using Function Component (Functional Noun)

// const App = (props: any) => {
// const App: FC<AppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayoutEmotion> = (props: any) => {
// const App: NextComponentType<AppContext, AppInitialProps, AppPropsWithLayout> = (props: any) => {
const RootLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  // //
  // console.debug('RootLayout.children', children)

  // // destructure props for vars
  // // const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  // const { Component, pageProps } = props
  const Component = {
    getLayout: false,
    setConfig: () => {},
    authGuard: true,
    guestGuard: false,
    acl: defaultACLObj
  }
  // console.debug('%c🥕 props', ccm.white, props)
  // console.debug('%c🥕 Component', ccm.black, Component)
  // console.debug('%c🥕 pageProps', ccm.black, pageProps)

  // ** PageComponent.Properties
  const getLayout = ({ children }: { children: any }): JSX.Element => {
    //
    console.debug('getLayout.children', children)

    const { props } = children

    // authorized: UserLayout
    if (props.childProp.segment !== ''
     && props.childProp.segment !== 'login'
     && props.childProp.segment !== 'register'
    ) {
      return (
        <div id='AppTemplate'>
          <UserLayout>
            {children}
          </UserLayout>
        </div>
      )
    }
    // default: BlankLayout
    else {
      return (
        <div id='AppTemplate'>
          <BlankLayout>
            {children}
          </BlankLayout>
        </div>
      )
    }
  }
  const setConfig = Component.setConfig ?? false
  const authGuard = Component.authGuard ?? true
  const guestGuard = Component.guestGuard ?? false
  const acl = Component.acl ?? defaultACLObj

  return (
    <ThreeDProvider>
      <ApolloProvider client={client}>
        <ReduxProvider store={reduxStore}>
          <AuthProvider>
            {/* <WindowWrapper> */}
              {/* <Guard
                authGuard={authGuard}
                guestGuard={guestGuard}
              > */}
                {/* <AclGuard
                  aclAbilities={acl}
                  guestGuard={guestGuard}
                > */}
                  <SettingsProvider {...(setConfig ? { pageSettings: setConfig() } : { pageSettings: null })}>
                  <SettingsConsumer>
                    {({ settings }) => (
                      <>
                        <ThemeComponent settings={settings}>
                          {getLayout(
                            // <UserLayout>
                              // <EthApp {...props}>
                                // <Component {...pageProps} />
                                {children}
                              // </EthApp>
                            // </UserLayout>
                          )}
                        </ThemeComponent>
                        {/* <ReactHotToast>
                          <Toaster
                            position={settings.toastPosition as ToastPosition}
                            toastOptions={{ className: 'react-hot-toast' }}
                          />
                        </ReactHotToast> */}
                      </>
                    )}
                    </SettingsConsumer>
                  </SettingsProvider>
                {/* </AclGuard> */}
              {/* </Guard> */}
            {/* </WindowWrapper> */}
          </AuthProvider>
        </ReduxProvider>
      </ApolloProvider>
    </ThreeDProvider>
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
