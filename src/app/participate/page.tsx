// ==============================================================
// ThreeD Garden Page (main landing page for 3D Character Demo)

'use client'

// ==========================================================
// RESOURCES

// ** AUTH GUARD
// import { auth } from 'auth'
// import { SessionProvider } from 'next-auth/react'
import { useSession } from 'next-auth/react'

// ** NEXT Imports
import dynamic from 'next/dynamic'
// import Image from 'next/image'
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** REACT Imports
import { 
  useEffect,
  Suspense 
} from 'react'

// ** THREED Components Imports
// import ThreeDComponents from '#/lib/threed/ThreeDComponents'
const ThreeDComponents = dynamic(() => import('#/lib/threed/ThreeDComponents'), { ssr: false })

// ** DATA

// ** APOLLO CLIENT STORE+STATE Imports
import { 
  useApolloClient, 
  useReactiveVar,
} from '@apollo/client'
import {
  isPreferencesDataSetVar,
  preferencesDataVar,
  preferencesStore,
  projectStore,
  // ...stores
} from '#/lib/api/graphql/apollo'

// ==========================================================

// ** HELPER Imports
import ccm from '#/lib/utils/console-colors'

// ** DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = false
const DEBUG: boolean = true

// ==========================================================

  // ** ⚙️ PREFERENCES STATE
  const prefs = preferencesDataVar() // YES
  // const prefs = useReactiveVar(preferencesDataVar) // NO
  console.debug('%c⚙️ ThreeDGarden prefs', ccm.orangeAlert, prefs)

  // ** ⚙️ PROJECT STATE
  // ** projectStore GET DATA
  let project = projectStore.store.get('one')
  console.debug('%c⚙️ ThreeDGarden project', ccm.redAlert, project)
  if (prefs.doAutoLoadData) {
    // console.debug('%c🥕 TRYING... ThreeDCanvasViewer {project} ', ccm.orangeAlert)
    try {
      // const project = projectStore.store.get('one') // regular
      // const project = projectStore.store.useStore('one') // hook
      // const project = async () => await projectStore.store.get('one') // async
      // console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orangeAlert, project)
      // console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orangeAlert, project())
      if (project) {
        // let project_title = project?.data?.title ? project.data.title : 'PROJECT TITLE: NOTHING YET, SIR: NOPE NOPE NOPE'
        // console.debug('%c🥕 ThreeDCanvasViewer {project}.project_title ', ccm.orange, project_title)
        if (project.data.plans) {
          let nodesToLoad: [] = []
          // ** [MM] HEY HEY HEY
          nodesToLoad = project.data.plans.nodes[0].threedsActive.nodes
          // ** [MM] HEY HEY HEY
          console.debug('%c🥕 Page {project}.[nodesToLoad] ', ccm.orange, nodesToLoad)
          // ** [MM] HEY HEY HEY
          // if (nodesToLoad) {
          //   // ** SET threeds[]
          //   // ** [MM] HEY HEY HEY
          //   threeds = nodesToLoad
          //   // ** [MM] HEY HEY HEY
          //   console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as [threeds] ', ccm.orange, threeds)
          // }
          // ** [MM] HEY HEY HEY
        }
      }
    } catch (ERROR) {
      console.error(ERROR)
    }
  }

// }, [])


// const ParticipatePage: TNextPageWithProps = (): React.ReactNode => {
const ParticipatePage: TNextPageWithProps = (pages: any): React.ReactNode => {
// const ParticipatePage: TNextPageWithProps = async () => {
// const ParticipatePage: TNextPageWithProps = async ({ children }: React.PropsWithChildren): Promise<React.ReactNode> => {
  // **
  // const session = await auth()
  // const { data: session, status } = useSession()
  // console.debug('%c🥕 Page {data}.session, status ', ccm.orange, session, status)
  // filter out sensitive data before passing to client.
  // if (session) {
    // console.debug('%c Participate page: session', ccm.greenAlert, session)
    // if (session?.user) {
    //   session.user = {
    //     name: session.user.name,
    //     email: session.user.email,
    //     image: session.user.image,
    //   }
    // }
  // }
  // else {
  //   console.debug('%c Participate page: NO session', ccm.redAlert)
  // }
  // let session = {
  //   user: {
  //     name: 'Marty',
  //     email: 'mcgee.marty@gmail.com',
  //     image: './images/logos/threed-garden.png'
  //   },
  //   expires: Date.now().toLocaleString(), // 'datetime as string',
  // }

  return (
    <ThreeDComponents />
  )
}

export default ParticipatePage
