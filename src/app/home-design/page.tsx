// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

// 'use client'
// ^^ this is now a server component. default pragma 'use server'

// ==============================================================
// RESOURCES

// ** REACT Imports
import {
  Suspense
} from 'react'

// ** NEXT Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// ** APOLLO Imports
import { 
  getApolloContext,

  useApolloClient,
  useReactiveVar,
  
  useQuery,
  useSuspenseQuery,
  useBackgroundQuery,
  useReadQuery,
  useFragment
} from '@apollo/client'
import {
  // stores,
  preferencesStore,
  canvasStateStore,
  projectStore,
  // queries,
  // mutations,
  // reactive state vars:
  isPreferencesSetVar,
  preferencesDataVar,
  isCanvasStateSetVar,
  canvasStateVar,
} from '#/lib/stores/apollo'

import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '~/src/layout/ui/session-data'
// import CustomLink from '~/src/layout/ui/custom-link'




// ** THREED Imports
// import ThreeDHomeDesign from '#/lib/home-design/src/HomeDesign'
const ThreeDHomeDesign = dynamic(() => import('#/lib/home-design/src/HomeDesign'), { ssr: false })


// ** EXPORT JSX as NEXT PAGE
// const HomeDesignPage = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: NextPage = (): JSX.Element => {
// const HomeDesignPage: TNextPageWithProps = (): JSX.Element => {
// export default function HomeDesignPage<TNextPageWithProps> (): JSX.Element { 
export default async function HomeDesignPage() {

  // const revenue = await fetchRevenue() // delete this line


/* NO HOOKS ALLOWED IN SERVER COMPONENT
  // ==========================================================
  // ** HOOKS (into [onMount] STATES)
  // ==========================================================

  // ** USE AUTH STATE
  // const auth = useAuth()
  // console.debug('useAuth(): auth', auth)
  
  // ** USE SESSION STATE
  // // const { data, status } = useSession()
  // const { data: sessionData, status: sessionStatus } = useSession()
  // console.debug('useSession().data', sessionData)
  // console.debug('useSession().status', sessionStatus)

  // ** USE CLIENT STATE
  const client = useApolloClient()
  // console.debug('%c🦆 useApolloClient()', ccm.orangeAlert) // , client

  // ** USE PREFERENCES STATE
  // const prefs = preferencesDataVar() // NO
  const prefs = useReactiveVar(preferencesDataVar) // YES !!
  // console.debug('%c⚙️ ThreeD Home Design prefs', ccm.orangeAlert, prefs)

  // ** INIT PAGE STATE
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  // ** INIT PREFERENCES STATE
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(useReactiveVar(isPreferencesSetVar))

  // ** USE CANVAS STATE
  const canvasState = useReactiveVar(canvasStateVar) // YES !!
  // console.debug('%c⚙️ ThreeD Home Design canvasState', ccm.orangeAlert, canvasState)
  // ** INIT CANVAS STATE
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false)
  const [isCanvasStateLoaded, setIsCanvasStateLoaded] = useState(useReactiveVar(isCanvasStateSetVar))

  // ==========================================================
  // ** USE CONTEXTS STATE (role-based abilities)
  // const abilities = useContext(AbilityContext)
  // const abilities = ['read', 'write', 'delete']
  // ==========================================================
  // ==========================================================

  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeD Home Design mounting ...', ccm.darkgreenAlert)

    
  let project_title = 'NOT EVEN CLOSE'
  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeD Home Design mounting ...', ccm.darkgreen, project_title)

    // 'default' === UILayout &&
    if (UILayout === 'default') {
      // $('#catalogItems').scroll(function () {
      //   loadInViewThumbs()
      // })
      // focusPoint = new paper.Point(0, 0)
      // raycaster = new THREE.Raycaster()
      // mouse = new THREE.Vector2()
      
      // DONE
      // async function fetchObjects() {
      //   let res = await fetch('api/objects.json')
      //   let data = await res.json()
      //   console.debug('fetchObjects data', data)
      //   setCatalogItems(data)
      //   // let arr = Array.from(Object.entries(data))
      //   // setCatalogItems(arr)
      //   // console.debug('fetchObjects data arr', arr)
      // }
      // fetchObjects()

      // DONE
      
      $.ajax({
        url: 'api/objects.json',
        type: 'GET',
        contentType: 'application/json',
        success: function (e: any) {
          if (((threedItems = e), 'default' === UILayout)) {
            var t = 0
            Object.keys(threedItems)
              // .sort()
              .forEach(function (e: any) {
                var o = camelCaseToSentence(e)
                $('#catalogItems').append(
                  '<div id='' +
                  e +
                  '' class='threedItem disableSelection' onmousedown='beginDrag(event, \'' +
                  e +
                  '\');'><img ' +
                  (t < 32
                    ? 'src='' + threedItemsURL + 'objects/' + e + '.png''
                    : 'src='images/homedesign/homedesign/thumbPlaceHolder.png'') +
                  ' realsrc='' + threedItemsURL + 'objects/' +
                  e +
                  '.png' class='threedThumb' alt='' +
                  o +
                  '' title='' +
                  o +
                  '' /></div>'
                ),
                  t++
              })
          }
        

        // WORKING ON...
        
        
          if (
            ($.ajax({
              url: 'plans/threed-plan-example-001.threed',
              type: 'GET',
              contentType: 'application/json',
              success: function (e: any) {
                var t = JSON.parse(e)
                featuredPlanImage.src = t.thumb
              },
              error: function (e: any) {
                console.debug('document.ready : get thumb ajax : ' + e)
              },
            }),
              'default' === UILayout &&
              ($('#wallDiffuse').minicolors({
                opacity: true,
                change: function (e, t) {
                  var o = parseInt(e.replace('#', '0x'))
                    ; (wallMaterial.color = new THREE.Color(o)),
                      (wallMaterial.opacity = parseFloat(t)),
                      (plan.wallDiffuse = wallMaterial.color),
                      (plan.wallOpacity = wallMaterial.opacity),
                      render()
                },
              }),
                $('#roofDiffuse').minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace('#', '0x'))
                      ; (roofMaterial.color = new THREE.Color(o)),
                        (roofMaterial.opacity = parseFloat(t)),
                        (plan.roofDiffuse = roofMaterial.color),
                        (plan.roofOpacity = roofMaterial.opacity),
                        render()
                  },
                }),
                $('#wallSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (wallMaterial.specular = new THREE.Color(t)),
                        (plan.wallSpecular = wallMaterial.specular),
                        render()
                  },
                }),
                $('#roofSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (roofMaterial.specular = new THREE.Color(t)),
                        (plan.roofSpecular = roofMaterial.specular),
                        render()
                  },
                }),
                $('#floorDiffuse').minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace('#', '0x'))
                      ; (floorMaterial.color = new THREE.Color(o)),
                        (floorMaterial.opacity = parseFloat(t)),
                        (plan.floorDiffuse = floorMaterial.color),
                        (plan.floorOpacity = floorMaterial.opacity),
                        render()
                  },
                }),
                $('#floorSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (floorMaterial.specular = new THREE.Color(t)),
                        (plan.floorSpecular = floorMaterial.specular),
                        render()
                  },
                }),
                $('#groundDiffuse').minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace('#', '0x'))
                      ; (groundMat.color = new THREE.Color(o)),
                        (groundMat.opacity = parseFloat(t)),
                        (plan.groundDiffuse = groundMat.color.getHexString()),
                        (plan.groundOpacity = groundMat.opacity),
                        render()
                  },
                }),
                $('#groundSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (groundMat.specular = new THREE.Color(t)),
                        (plan.groundSpecular = groundMat.specular.getHexString()),
                        render()
                  },
                })),
              fragment)
          )
            $.ajax({
              url: 'api/getsharelink/' + fragment,
              type: 'GET',
              contentType: 'application/json',
              success: function (e: any) {
                var t = JSON.parse(e)
                e.error
                  ? console.debug(e.error)
                  : ((loadingProgressTxt = 'Loading Shared Plan'),
                    (document.getElementById('modalLoadingDataInfo').innerHTML =
                      loadingProgressTxt),
                    $('#loadingModal').show(),
                    hideMouseIndicators(),
                    drawPlan(t))
              },
              error: function (e: any) {
                console.debug('document.ready : getsharelink : ' + e)
              },
            })
          else {
            var o = localStorage.getItem('plan')
            if (o) {
              var o = JSON.parse(o)
                ; (loadingProgressTxt = 'Loading Cached Plan'),
                  (document.getElementById('modalLoadingDataInfo').innerHTML =
                    loadingProgressTxt),
                  $('#loadingModal').show(),
                  hideMouseIndicators(),
                  drawPlan(o)
            } else showAbout(), setNewPlan()
          }
        },
        error: function (e: any) {
          console.dir(e)
        },
      }),
      
      
      
      // ** end if ajax true
      // ** ================================================
    }


  */


  // ** RETURN JSX
  // ** Return Jsx
  // ** retuRn JSX.Element
  return (
    <Suspense fallback={'HEY HEY HEY'}>
      <div
        style={{
          display: 'inline-flex',
          flexGrow: '1',
          height: '90vh',
          width: '99.8%',
        }}
      >
        <ThreeDHomeDesign />
      </div>
    </Suspense>
  )
}
