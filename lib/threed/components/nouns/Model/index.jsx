import { proxy, useSnapshot } from 'valtio'

import { useEffect, useState, useRef } from 'react'

// ** R3-Fiber + R3-Drei
import {
  useThree,
  // useFrame,
  useLoader
} from '@react-three/fiber'
import {
  // ContactShadows,
  useCursor,
  useGLTF,
  useFBX,
  // useOBJ, // not supported
  useAnimations,
  useTexture,
  Loader
} from '@react-three/drei'
// Three Loaders
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
// import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

// React Spring (for actions)
// import { a, useSpring } from '@react-spring/three'

// ** EXAMPLES
import CoffeeCup from '~/lib/threed/components/examples/CoffeeCup/CoffeeCup'

// ** UUID Imports
import { v4 as newUUID } from 'uuid'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// ** VARIABLES

const debug = false // false | true // ts: boolean
const DEBUG = true // false | true // ts: boolean

// ==============================================================

// ** ThreeD Model -||-
const Model = ({
  name = 'GLBs',
  node = {
    file: null
  },
  // modelState = {},
  // sceneState = {},
  // storeState = {},
}) => {
// const Model = ({modelState = {}}) => {

  // **
  console.debug('Model props.name', name)
  // console.debug('Model props.modelState', modelState)
  // console.debug('Model props.sceneState', sceneState)
  // console.debug('Model props.storeState', storeState)
  console.debug('Model props.node', node)

  // return <><CoffeeCup /></>

  // get Reactive state on each model (using valtio)
  const modelState = proxy({ current: null, mode: 0 })

  // Ties this component to the model state
  const snap = useSnapshot(modelState)

  // set a default file to load for Model (for testing)
  // fileUrlDefault: '/objects/examples/compressed.glb' | '/objects/examples/compressed-v002.glb' |
  const fileUrlDefault =
  // '/objects/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.glb'
  // 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.glb'
  // '/objects/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.fbx'
  'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.fbx'
  // '/objects/examples/coffee-transformed.glb'

  // this model = threed_model -||-
  const model = {
    ref: useRef(null),
    name: name,
    // object nodes
    nodes: [],
    // state: modelState, // for funzees
    // sceneState: sceneState, // for funzees
    // storeState: storeState, // for funzees
    // file: nodes.files[0]?.nodes[0]?.url,
    // file: file,
    // file: fileUrlDefault,
    file: node.url ? node.url : fileUrlDefault,
    // file type?
    type: 'threed_node', // fbx | gltf | obj | threed | threed_node
    // 3D
    isObject3D: false,
    isGLTF: false,
    isFBX: false,
    isOBJ: false,
    isMTL: false, // meta file for OBJ
    // 2D
    isImage: false,
    isPNG: false,
    isJPG: false,
    isGIF: false,
    isSVG: false,
    isWEBP: false,
    // is type Supported?
    isSupported: false,
    // animations
    ani: {
      ref: null,
      actions: [],
      names: [],
    },
    // doReturnOne: doReturnOne ? true : false,
    // doReturnAll: doReturnAll ? true : false,
    // doReturnEach: doReturnEach ? true : false,
    // attributes
    group_position: 0, // nodes?.group?.position ?? 0,
    group_rotation: 0, // nodes?.group?.rotation ?? 0,
    group_scale: 0, // nodes?.group?.scale ?? 0,
    // is Ready to go?
    isReadyForCanvas: false,
  }

  // ** set available action modes
  const modes = ['translate', 'rotate', 'scale']

  // ** decide file type from file extension (and other qualifiers)
  // const fileExt = model.file?.split('.').pop()
  const fileExt = 'tbd'
  // console.debug('fileExt', fileExt)
  model.type = fileExt
  // const testExt = /\.(glb|gltf|fbx|obj|mtl|gif|jpe?g|tiff?|png|webp|bmp)$/i.test(model.file)
  // console.debug('testExt', testExt)
  model.isObject3D = /\.(glb|gltf|fbx|obj)$/i.test(model.file)
  model.isGLTF = /\.(glb|gltf)$/i.test(model.file)
  model.isFBX = /\.(fbx)$/i.test(model.file)
  model.isOBJ = /\.(obj)$/i.test(model.file)
  model.isMTL = /\.(mtl)$/i.test(model.file)
  model.isImage = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(model.file)
  model.isPNG = /\.(png)$/i.test(model.file)
  model.isJPG = /\.(jpe?g)$/i.test(model.file)
  model.isGIF = /\.(gif)$/i.test(model.file)
  model.isSVG = /\.(svg)$/i.test(model.file)
  model.isWEBP = /\.(webp)$/i.test(model.file)
  model.isSupported = /\.(glb|gltf|fbx|obj|mtl|gif|jpe?g|png|webp)$/i.test(model.file)

  // fetch the file (GLTF, FBX, OBJ, etc)
  if (model.isSupported) {
    // console.debug('%cmodel.isSupported: true', ccm.green)
    console.debug(`%c======================================`, ccm.black)
    if (model.isObject3D) {
      // FBX
      if (model.isFBX) {
        model.type = 'fbx'
        // const { nodes, animations } = useFBX(model.file)
        // const fbx = useFBX(model.file)
        const fbx = useLoader(FBXLoader, model.file, loader => {
          loader.manager.addHandler(/\.tga$/i, new TGALoader())
        })
        console.debug('%c NODES: fbx', ccm.darkgreen, [{...fbx}])
        console.debug(`%c======================================`, ccm.darkgreen)
        if (fbx) {
          model.nodes = [{...fbx}]
          // console.debug('RETURN ONLY NODE AS NODES: true')
        }
        if (fbx.animations) {
          // console.debug('FBX animations', fbx.animations)
          // Extract animation actions
          const { ref, actions, names } = useAnimations(fbx.animations)
          // console.debug('FBX useAnimations', ref, actions, names)
          model.ani.ref = ref
          model.ani.actions = actions
          model.ani.names = names
        }
      }
      // OBJ
      else if (model.isOBJ) {
        model.type = 'obj'
        // const nodes = useOBJ(model.file)
        const nodes = new OBJLoader().load(model.file)
        console.debug('%c NODES: obj', ccm.darkgreen, nodes)
        console.debug(`%c======================================`, ccm.darkgreen)
        if (nodes) {
          model.nodes = nodes
          // console.debug('RETURN ONLY NODE AS NODES: true')
        }
      }
      // GLTF
      else if (model.isGLTF && 1 == 0) {
        model.type = 'gltf'
        // nodes[] is an array of all the meshes
        // file is cached/memoized; it only gets loaded and parsed once
        // const file = '/objects/examples/compressed-v002.glb'
        // const { nodes } = useGLTF(model.file)
        const { nodes } = useLoader(GLTFLoader, model.file, loader => {
          loader.manager.addHandler(/\.tga$/i, new TGALoader())
        })
        console.debug('%c NODES: gltf 🥕 GLB NODES 🌱', ccm.darkgreen, nodes)
        console.debug(`%c======================================`, ccm.darkgreen)
        if (nodes) {
          // FILTER (LOOP OVER) NODES {Object.keys}
          // to get the single node you are asking for
          // if (model.doReturnAll) {
          //   model.nodes = nodes
          //   console.debug('%c RETURN ALL NODES: true', ccm.yellow, model.nodes)
          //   console.debug(`%c======================================`, ccm.yellow)
          // }
          // else
          if (nodes.RootNode) {
            // model.nodes[model.name] = nodes.RootNode.children
            model.nodes = nodes.RootNode.children
            console.debug('%c RETURN RootNode CHILDREN NODES: true', ccm.darkgreen)
            console.debug(`%c======================================`, ccm.darkgreen)
          }
          // OR RETURN ALL NODES, OR QUERY A LIST OF NODES you want...
          // else
          else if (model.nodes[model.name]) {
            // for one node key requested...
            model.nodes[model.name] = nodes[model.name]
            console.debug('%c RETURN ONE NODE: true', ccm.orange, model.nodes[model.name])
            console.debug(`%c======================================`, ccm.orange)

            // OR...
            // console.debug('OR: ')
            // console.debug('RETURN EACH NODE: true')
            // // for each node key requested...
            // Object.keys(nodes).forEach((value, index, array) => {
            //   console.debug('RETURN EACH NODE by KEY: ', index, value)
            // })
          }
          else {
            model.nodes = nodes
            console.debug('%c RETURN ALL NODES: default', ccm.red)
            console.debug(`%c======================================`, ccm.red)
          }
        }
      }

      // finally
      if (model.nodes.length) {
        model.isReadyForCanvas = true
        console.debug('%c MODEL IS READY FOR CANVAS', ccm.darkgreen)
        console.debug(`%c======================================`, ccm.darkgreen)
      }
    }
    // console.debug(`%c======================================`, ccm.black)
  } else {
    console.debug('%c MODEL.isSupported: false', ccm.red)
    console.debug(`%c======================================`, ccm.red)
  }
  // console.debug('%cmodel', ccm.green, model)
  // console.debug(`%c======================================`, ccm.black)

  // ==============================================================

  // Feed hover state into useCursor, which sets document.body.style.cursor to pointer|auto
  const [isHovered, setIsHovered] = useState(false)
  useCursor(isHovered)
  const [index, setIndex] = useState(0)

  // // Animate the selection halo
  // const { color, scale } = useSpring({
  //   scale: isHovered ? [1.15, 1.15, 1] : [1, 1, 1],
  //   color: isHovered ? '#ff6d6d' : '#569AFF',
  // })

  // // Change cursor on hover-state
  // useEffect(() => void (document.body.style.cursor = isHovered ? 'pointer' : 'auto'), [isHovered])

  // // Change animation when the index changes
  // useEffect(() => {
  //   if (model.ani.actions != undefined
  //     && model.ani.names != undefined
  //     && model.ani.actions[model.ani.names[index]] != undefined
  //   )
  //     // Reset and fade in animation after an index has been changed
  //     model.ani.actions[model.ani.names[index]].reset().fadeIn(0.5).play()

  //     // In the clean-up phase, fade it out
  //     // (page route may have changed)
  //     if (model.ani.actions[model.ani.names[index]]) {
  //       return () => { try { model.ani.actions[model.ani.names[index]].fadeOut(0.5) } catch (ERROR) {} }
  //     }

  //   return undefined
  // }, [index, model.ani.actions, model.ani.names])

  // ==============================================================
  // ANIMATIONS (FOR ALL MODELS !!!)

  // useFrame(({ clock }) => {
  //   const a = clock.getElapsedTime()
  //   model.ref.current.rotation.x = a
  // })

  // ==============================================================
  // ** RETURN JSX

  if (model.isReadyForCanvas) {
    console.debug(`%c======================================`, ccm.blue)
    console.debug(`%cDRAW MODEL([nodes]): ${model.type}`, ccm.blue, model.nodes)
    console.debug(`%c======================================`, ccm.blue)
    // return GLTF node
    if (model.isGLTF) {
      const model_name = model.name ? model.name : 'model.name HMM HMM HMM'
      // NEED LOOP OVER NODE ARRAY TO RETURN MULTIPLE MESHES ([4420])
      const model_geometry = model.nodes[0].geometry
      const model_material = model.nodes[0].material
      return (
        <mesh
          name={model.name}
          ref={model.ref}
          // Click sets the mesh as the new target
          onClick={(e) => (e.stopPropagation(), (modelState.current = model_name))}
          // If a click happened but this mesh wasn't hit we null out the target,
          // This works because missed pointers fire before the actual hits
          onPointerMissed={(e) => e.type === 'click' && (modelState.current = null)}
          // Right click cycles through the transform modes
          onContextMenu={(e) =>
            snap.current === model.name && (e.stopPropagation(), (modelState.mode = (snap.mode + 1) % modes.length))
          }
          onPointerOver={(e) => (e.stopPropagation(), setIsHovered(true))}
          onPointerOut={(e) => setIsHovered(false)}
          geometry={model_geometry}
          material={model_material}
          material-color={snap.current === model_name ? '#ff7070' : '#ababab'}
          // {...props}
          dispose={null}
        />
      )
    }
    // return FBX node
    else if (model.isFBX) {
      const model_name = model.name ? model.name : 'no name'
      const model_geometry = model.nodes.geometry
      const model_material = model.nodes.material
      return (
        <group
          ref={model.ani.ref}
          // {...props}
          dispose={null}
          position={model.group_position}
          rotation={model.group_rotation}
          scale={model.group_scale}
        >
          <primitive
            name={model_name}
            // ref={model.ref}
            ref={model.ani.ref}
            object={model.nodes}
          />
        </group>
      )
    }
    // return OBJ node
    else if (model.isOBJ) {
      return (
        <mesh
          ref={model.ref}
        />
      )
    }
  }
  // DEFAULT RETURN
  // 'error sphere' mesh object, with original model.name and props
  // else {
  return (
    <mesh
      name={model.name}
      ref={model.ref}
      // Click sets the mesh as the new target
      onClick={(e) => (
        e.stopPropagation(),
        (modelState.current = model.name),
        console.debug('modelState.current', model.name),
        console.debug('snap.current', snap.current)
      )}
      // If a click happened but this mesh wasn't hit we null out the target,
      // This works because missed pointers fire before the actual hits
      onPointerMissed={(e) => (
        e.type === 'click',
        (modelState.current = null),
        console.debug('modelState.current', null),
        console.debug('snap.current', snap.current)
      )}
      // Right click cycles through the transform modes
      onContextMenu={(e) =>
        snap.current === model.name &&
        (e.stopPropagation(),
        (modelState.mode = (snap.mode + 1) % modes.length),
        console.debug('modelState.mode', modelState.mode),
        console.debug('snap.current', snap.current))
      }
      onPointerOver={(e) => (e.stopPropagation(), setIsHovered(true))}
      onPointerOut={(e) => setIsHovered(false)}
      // {...props}
      dispose={null}>
      <sphereGeometry args={[4, 96]} />
      <meshPhysicalMaterial
        color={model.isGLTF ? 'darkRed' : model.isOBJ ? 'darkOrange' : model.isFBX ? 'darkGreen' : 'darkPink'}
      />
    </mesh>
  )
  // }
}

// Controls
function ThreeDControls() {
  // **

  // get Reactive state on each model (using valtio)
  const modelState = proxy({ current: null, mode: 0 })
  // get Apollo Stores state
  const storeState = undefined
  const sceneState = useThree((sceneState) => sceneState.scene)
  if (sceneState) {
    if (debug || DEBUG) console.debug('%c sceneState to load to ThreeDCanvas', ccm.yellow, sceneState)
    if (sceneState.length) {
      // if (debug) console.debug('sceneState.length', sceneState.length)
    }
  }

  // Get 'snap' notified on changes to modelState + sceneState
  const snap = useSnapshot(modelState)

  return (
    <>
      {/* As of drei@7.13 transform-controls can refer to the target by children, or the object prop */}
      {snap.current && (
        <TransformControls
          object={sceneState.getObjectByName(snap.current)}
          mode={modes[snap.mode]}
        />
      )}
    </>
  )
}

// ==============================================================
// EXAMPLE -- LOOP OVER ARRAY OF NODES TO CREATE INDIVIDUAL MODELS
// **
// interface personType {
//   name: string
// }
// export const Elements = (props: { persons: Array<personType> }) => {
//   return (
//     <>
//       {props.persons.map((person: personType) => <h1>{person.name}</h1>)}
//     </>
//   )
// }
// export default const Test = () => {
//   var personsArray: personType[] = []
//   return (<Elements persons={personsArray} />)
// }

// ==============================================================
// **
export default function ThreeDModels({ nodes }) {
  // **
  // const nodesToModelAndLoad = nodes
  console.debug('%c🌱 nodes[]', ccm.blue, nodes)
  // **

  // get Reactive state on each model (using valtio)
  // const modelState = proxy({ current: null, mode: 0 })
  // get Apollo Stores state
  // const storeState = undefined
  // const sceneState = useThree((sceneState) => sceneState.scene)
  // if (sceneState) {
  //   if (debug || DEBUG) console.debug('%c sceneState to load to ThreeDCanvas', ccm.yellow, sceneState)
  //   if (sceneState.length) {
  //     // if (debug) console.debug('sceneState.length', sceneState.length)
  //   }
  // }

  // **
  // Get 'snap' notified on changes to modelState + sceneState
  // const snap = useSnapshot(modelState)
  // DEFAULTS
  const name = 'YO YO YO -- LOAD NODE TO CANVAS' // todo: set appropriately
  // const modelState = {modelState} // funzees in action -- communication points
  // const sceneState = {sceneState} // funzees in action -- communication points
  // const storeState = {storeState} // funzees in action -- communication points

  // return <CoffeeCup />
  return (
    <>
      {/* <CoffeeCup /> */}

      {nodes.map((node) => {
        return (
          node.files.nodes.map((file) => {
            return (
              <group
                key={newUUID()}
              >
                <Model
                  key={newUUID()}
                  name={file.title}
                  node={file}
                />
                {/* <CoffeeCup
                  key={newUUID()}
                /> */}
                {/* <ThreeDControls /> */}
              </group>
            )
          })
        )
      })}

    </>
  )
}


/*
        {nodes.map((node) => {
          console.debug('%c node', ccm.orange, node)
          {(<CoffeeCup />)}
          {node.files.nodes.map((file) => {
            console.debug('%c  file', ccm.yellow, file)
            {(
              <>
              <Model
                name={file.title}
                node={file}
                // makeDefault
                // minPolarAngle={0}
                // maxPolarAngle={Math.PI / 1.75}
                // autoRotate={false}
              />
              <ThreeDControls />
              </>
            )}

          })}
        })}
*/
