import { proxy, useSnapshot } from 'valtio'

import { useEffect, useState, useRef } from 'react'

// ** R3-Fiber + R3-Drei
import {
  useThree,
  useFrame,
  useLoader,
} from '@react-three/fiber'
import {
  Loader,
  useCursor,
  useGLTF,
  useFBX,
  useAnimations,
  useTexture,
  // ContactShadows,
} from '@react-three/drei'
// Three Loaders
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
// import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

// React Spring (for actions)
// import { useSpring, a } from '@react-spring/three'

// ** EXAMPLES
import CoffeeCup from '~/lib/threed/components/examples/CoffeeCup/CoffeeCup'

// ** UUID Imports
import { v4 as newUUID } from 'uuid'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// ** VARIABLES

const debug = true // false | true // ts: boolean
const DEBUG = true // false | true // ts: boolean

// ==============================================================
// ** ThreeD == Group of > Files of > Nodes of > 3DObjects
let Interface_ThreeD = {
  name: 'THREED DEFAULT: FILE (GROUP OF) NODES TO RENDER',
  data: {}, // original data records from db/api
  group: {
    group_id: newUUID(),
    // NOTE: 1.570796 radians = 90 degrees
    group_position: [0, 0, 0],
    group_rotation: [0, 0, 0], // [-1.570796, 0, 0],
    group_scale: 1.0, // 0.01 | 0.05 | 0.5 | 1.0 | 5.0 | 50.0 | 100.0
  },
  file: {
    __typename: 'File',
    file: null,
    fileId: 0,
    fileType: 'tbd',
    isObject3d: false,
    isUrl: false,
    modified: '',
    title: '',
    uri: '',
    url: '',
  },
  fileUrl: '',
  nodes: [], // nodes from file(s) == threed.nodes
  actionModes: [
    'translate',
    'rotate',
    'scale'
  ]
}

// ** ThreeD Object -- Constructor Function
// -- returns new ThreeD
// function ThreeD(this: IThreeD, _type: string = 'ThreeD') {
function ThreeD(_type = 'ThreeD') {
  // object params
  this.name = 'ThreeD: Default FILE (GROUP OF) NODES TO RENDER'
  this.data = {} // original data records from db/api
  this.group = {
    group_id: newUUID(),
    // NOTE: 1.570796 radians = 90 degrees
    group_position: [0, 0, 0],
    group_rotation: [0, 0, 0], // [-1.570796, 0, 0],
    group_scale: 1.0, // 0.01 | 0.05 | 0.5 | 1.0 | 5.0 | 50.0 | 100.0
  }
  this.file = {
    __typename: 'File',
    file: null,
    fileId: 0,
    fileType: 'tbd',
    isObject3d: false,
    isUrl: false,
    modified: '',
    title: '',
    uri: '',
    url: '',
  }
  this.fileUrl = ''
  this.nodes = [] // nodes from file(s) == threed.nodes
  this.actionModes = [
    'translate',
    'rotate',
    'scale'
  ]
}

// ** ThreeD Model -||-
const Model = ({
  threed =     new ThreeD(),
  // name =    ThreeD.name,
  // group =   ThreeD.group,
  // file =    ThreeD.file
}) => {

  // **
  // ** for testing only
  // ** return 1 ThreeD Object in JSX
  // return <><CoffeeCup /></>

  // get Reactive state on each model (using valtio)
  // const modelVState = proxy({ current: null, mode: 0 })
  // const modelVState = proxy({ current: null, mode: 0 })

  // Ties this component to the model state
  // const snap = useSnapshot(modelVState)

  // **
  console.debug(`%c====================================`, ccm.black)
  console.debug('%c🖊️ Model props.threed', ccm.red, threed.name, threed)
  // console.debug('%c🖊️ Model props.threed.name', ccm.red, threed.name)
  // console.debug('%c🖊️ Model props.threed.group', ccm.red, threed.group)
  // console.debug('%c🖊️ Model props.threed.file', ccm.red, threed.file)
  console.debug(`%c====================================`, ccm.black)
  // console.debug('%c🖊️ Model modelVState', ccm.red, modelVState)
  // console.debug('%c🖊️ Model snap', ccm.red, snap)
  // console.debug('Model props.sceneState', sceneState)
  // console.debug('Model props.storeState', storeState)

  // set a default file to load for Model (for testing)
  // fileUrlDefault: '/objects/examples/compressed.glb' | '/objects/examples/compressed-v002.glb' |
  const fileUrlDefault =
    // ''
    // '/objects/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.glb'
    // 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.glb'
    // '/objects/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.fbx'
    // 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.fbx'
    // '/objects/examples/coffee-transformed.glb'
    // 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/FBX/SM_Prop_Carrot_01.fbx'
    'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/FBX/SM_Prop_Plant_Corn_01.fbx'
  const fileUrl = threed.file?.isUrl ? threed.file.url : fileUrlDefault

  // this model = threed_model -||-
  const model = {
    ref:        useRef(null),
    name:       threed.name,
    file:       fileUrl,                // threed.file.url,
    group:      threed.group,
    nodes:      threed.nodes,
    //** custom fields
    __typename: threed.data.__typename, // 'Threed'
    content:    threed.data.content,
    files:      threed.data.files,
    threedId:   threed.data.threedId,
    title:      threed.data.title,      // 'ThreeD Demo: McGee Ranch (FBX)',
    uri:        threed.data.uri,        // '/threed-threed/threed-demo-mcgee-ranch-fbx/',
    version:    threed.data.version,    // '0.0.2',
    modified:   threed.data.positionX,  // '2024-03-13T04:18:47',
    positionX:  threed.data.positionX,
    positionY:  threed.data.positionY,
    positionZ:  threed.data.positionZ,
    rotationX:  threed.data.rotationX,
    rotationY:  threed.data.rotationY,
    rotationZ:  threed.data.rotationZ,
    scaleX:     threed.data.scaleX,
    scaleY:     threed.data.scaleY,
    scaleZ:     threed.data.scaleZ,

    // state:  modelVState, // for funzees ??
    // sceneState: sceneState, // for funzees ??
    // storeState: storeState, // for funzees ??

    // file type?
    type: 'tbd', // fbx | gltf | obj | threed | threed_node
    // ** decide file type from file extension (and other qualifiers)
    // const testExt = /\.(glb|gltf|fbx|obj|mtl|gif|jpe?g|tiff?|png|webp|bmp)$/i.test(fileUrl)
    // console.debug('testExt', testExt)
    is: {
      // is Ready to go?
      isReadyForCanvas: false,
      // file type is.isSupported?
      isSupported: /\.(glb|gltf|fbx|obj|mtl|gif|jpe?g|png|webp)$/i.test(fileUrl),
      // 3D Objects
      isObject3D: /\.(glb|gltf|fbx|obj)$/i.test(fileUrl),
      isGLTF: /\.(glb|gltf)$/i.test(fileUrl),
      isFBX: /\.(fbx)$/i.test(fileUrl),
      isOBJ: /\.(obj)$/i.test(fileUrl),
      isMTL: /\.(mtl)$/i.test(fileUrl), // meta file for OBJ
      // 2D Files
      isImage: /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(fileUrl),
      isPNG: /\.(png)$/i.test(fileUrl),
      isJPG: /\.(jpe?g)$/i.test(fileUrl),
      isGIF: /\.(gif)$/i.test(fileUrl),
      isSVG: /\.(svg)$/i.test(fileUrl),
      isWEBP: /\.(webp)$/i.test(fileUrl),
      // ThreeD Nodes
      isThreeD: false,
      isThreeDNode: false,
    },
    // animations
    ani: {
      ref: null,
      actions: [],
      names: [],
    },
  }

  // fetch the file (GLTF, FBX, OBJ, etc)
  if (model.is.isSupported) {
    console.debug('%c🌱 model.is.isSupported: true', ccm.greenAlert, model.name, model)
    console.debug(`%c======================================`, ccm.darkgreen)
    if (model.is.isObject3D) {
      // FBX
      if (model.is.isFBX) {
        model.type = 'fbx'
        // const { nodes, animations } = useFBX(model.file)
        // const fbx = useFBX(model.file)
        const fbx = useLoader(FBXLoader, model.file, loader => {
          loader.manager.addHandler(/\.tga$/i, new TGALoader())
        })
        console.debug('%c📐 FBX NODES: fbx', ccm.greenAlert, model.name, fbx)
        console.debug(`%c======================================`, ccm.darkgreen)
        if (fbx) {
          // model.node = fbx
          model.nodes = fbx
          // console.debug('RETURN ONLY NODE AS NODES: true', model.nodes)
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
      else if (model.is.isOBJ) {
        model.type = 'obj'
        // const nodes = useOBJ(model.file)
        const obj = new OBJLoader().load(model.file)
        console.debug('%c🌱 OBJ NODES: obj', ccm.orange, obj)
        console.debug(`%c======================================`, ccm.orange)
        if (obj) {
          model.nodes = obj
          // console.debug('RETURN ONLY NODE AS NODES: true')
        }
      }
      // GLTF
      else if (model.is.isGLTF) {
        model.type = 'gltf'
        // nodes[] is an array of all the meshes
        // file is cached/memoized; it only gets loaded and parsed once
        // const gltf = useGLTF(model.file)
        const gltf = useLoader(GLTFLoader, model.file) // , loader => {
          // loader.manager.addHandler(/\.tga$/i, new TGALoader())
        // })
        // console.debug('%c📐 GLB NODES: gltf', ccm.greenAlert, model.name, gltf)
        console.debug(`%c======================================`, ccm.darkgreen)
        if (gltf) {
          if (gltf.RootNode) {
            model.nodes = gltf.RootNode.children
            console.debug('%c📐 RETURN RootNode CHILDREN NODES: true', ccm.orangeAlert, model.name, model.nodes)
            console.debug(`%c======================================`, ccm.orange)
          }
          else if (model.nodes[model.name]) {
            model.nodes[model.name] = gltf[model.name]
            console.debug('%c📐 RETURN ONE NODE: true', ccm.orangeAlert, model.name, model.nodes[model.name])
            console.debug(`%c======================================`, ccm.orange)
          }
          else if (gltf.nodes) {
            // let gltfAsArray = new Array()
            // gltfAsArray.push([...Array(gltf.nodes)])
            // for (const [key, value] of Object.entries(gltf.nodes))  {
            //   console.debug(`key: ${key}, value: ${value}`)
            //   gltfAsArray.push([key: value])
            // }
            let objParent = gltf
            let obj = gltf // gltf | gltf.nodes
            model.nodes = obj
            // let objNodes = gltf.nodes // gltf | gltf.nodes
            // let objKeys = new Array()
            // let gltfAsArray = new Array()
            // let objCount = 48 // maximum to return
            // objKeys = Object.keys(obj) // returns all keys [5446]
            // // console.debug('%c📐 objKeys', ccm.orangeAlert, objKeys)
            // let objectAsArray = objKeys.slice(0, objCount).map((key, index) => {
            //   // let kvpair = {}
            //   // // kvpair[key] = obj[key]
            //   // kvpair[index] = obj[key]
            //   // return kvpair
            //   return obj[key] // just the value of the object at this key
            // })
            // gltfAsArray = objectAsArray
            // // model.nodes = gltfAsArray
            // // console.debug('%c📐 gltfAsArray', ccm.orangeAlert, gltfAsArray)
            // // model.nodes = gltf.nodes
            // // model.nodes = gltf
            console.debug('%c📐 RETURN ALL GLTF NODES: default', ccm.greenAlert, model.name, model.nodes)
            console.debug(`%c======================================`, ccm.darkgreen)
          }
          else {
            model.nodes = gltf.nodes // []
            console.debug('%c📐 RETURN ALL/BLANK NODES: default', ccm.redAlert, model.name, model.nodes)
            console.debug(`%c======================================`, ccm.red)
          }
        }
      }

      // finally, decide if ready for _r3f canvas
      if (model.nodes && model.is.isFBX) {
        model.is.isReadyForCanvas = true
        console.debug('%c✔️📐 THREED MODEL IS READY FOR CANVAS', ccm.greenAlert, model.name, model)
        console.debug(`%c===========================================================`, ccm.darkgreen)
      }
      else if (model.nodes && model.is.isGLTF) {
        model.is.isReadyForCanvas = true
        console.debug('%c✔️📐 THREED MODEL IS READY FOR CANVAS', ccm.greenAlert, model.name, model)
        console.debug(`%c===========================================================`, ccm.darkgreen)
      }
      else {
        model.is.isReadyForCanvas = false
        console.debug('%c✖️📐 THREED MODEL IS NOT READY FOR CANVAS', ccm.redAlert, model.name, model)
        console.debug(`%c===========================================================`, ccm.red)
      }
    }
    // console.debug(`%c======================================`, ccm.black)
  } else {
    console.debug('%c✖️📐 MODEL.is.isSupported: false', ccm.redAlert, model.name)
    console.debug(`%c===========================================================`, ccm.red)
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
  useEffect(
    () => void (document.body.style.cursor = isHovered ? 'pointer' : 'auto'), [isHovered])

  // Change animation when the index changes
  useEffect(() => {
    if (model.ani.actions != undefined
      && model.ani.names != undefined
      && model.ani.actions[model.ani.names[index]] != undefined
    )
      // Reset and fade in animation after an index has been changed
      model.ani.actions[model.ani.names[index]].reset().fadeIn(0.5).play()

      // In the clean-up phase, fade it out
      // (page route may have changed)
      if (model.ani.actions[model.ani.names[index]]) {
        return () => { try { model.ani.actions[model.ani.names[index]].fadeOut(0.5) } catch (ERROR) {} }
      }

    return undefined
  }, [index, model.ani.actions, model.ani.names])

  // ==============================================================
  // ANIMATIONS (FOR ALL MODELS !!!)

  useFrame(({ clock }) => {
    const ThreeDClock = clock
    // const a = clock.getElapsedTime()
    // model.ref.current.rotation.z = a
  })

  // ==============================================================
  // ** RETURN JSX

  if (model.is.isReadyForCanvas) {
    // console.debug(`%c===========================================================`, ccm.blue)
    // console.debug(`%c✔️📐 DRAW MODEL ${model.type}`, ccm.blue, model.name) // , model
    console.debug(`%c✔️📐 DRAW MODEL.nodes: ${model.type}`, ccm.blue, model.name, model.nodes)
    console.debug(`%c===========================================================`, ccm.blue)
    // return FBX node
    if (model.is.isFBX) {
      return (
        <group
          key={newUUID()}
          ref={model.ref}
          // ref={model.ani.ref}
          position={model.group.group_position}
          rotation={model.group.group_rotation}
          scale={model.group.group_scale}
          // rotationX
          dispose={null}
        >
          <primitive
            name={model.name ? model.name : 'no name'}
            // ref={model.ref}
            // ref={model.ani.ref}
            object={model.nodes}
            dispose={null}
          />
        </group>
      )
    }
    // return GLTF node
    else if (model.is.isGLTF) {
      // console.debug('GLTF: model.nodes', model.name, model.nodes)
      // console.debug('GLTF: model.nodes.scene', model.name, model.nodes.scene)
      return (
        // LOOP OVER NODE ARRAY TO RETURN MULTIPLE MESHES ([5000])
        <group
          key={model.group.group_id} // newUUID()
          ref={model.ref}
          // ref={model.ani.ref}
          position={model.group.group_position}
          rotation={model.group.group_rotation}
          scale={model.group.group_scale}
          dispose={null}
        >
          {/* const Model = () => {
            const gltf = useLoader(GLTFLoader, "./bomb.gltf");
            return <primitive object={gltf.scene} scale={0.4} />;
          }; */}
          <primitive
            name={model.name ? model.name : 'no name'}
            // ref={model.ref}
            // ref={model.ani.ref}
            object={model.nodes.scene} // gltf.scene
            dispose={null}
            // scale={1.0}
          />
          {/* {model.nodes.map((_model_node, index) => (
            <mesh
              key={model.group.group_id + '-' + index} // newUUID() | index
              // name={_model_node.name}
              // ref={_model_node.ref}
              // // Click sets the mesh as the new target
              // onClick={(e) => (e.stopPropagation(), (modelVState.current = _model_node.name))}
              // // If a click happened but this mesh wasn't hit we null out the target,
              // // This works because missed pointers fire before the actual hits
              // onPointerMissed={(e) => e.type === 'click' && (modelVState.current = null)}
              // // Right click cycles through the transform ThreeD.actionModes
              // onContextMenu={(e) =>
              //   snap.current === _model_node.name && (e.stopPropagation(), (modelVState.mode = (snap.mode + 1) % ThreeD.actionModes.length))
              // }
              // onPointerOver={(e) => (e.stopPropagation(), setIsHovered(true))}
              // onPointerOut={(e) => setIsHovered(false)}
              geometry={_model_node.geometry}
              material={_model_node.material}
              // material-color={snap.current === _model_node.name ? '#ff7070' : '#ababab'}
              // {...props}
              dispose={null}
            />
          ))} */}
        </group>
      )
    }
    // return OBJ node
    else if (model.is.isOBJ) {
      return (
        <mesh
          key={newUUID()}
          ref={model.ref}
          dispose={null}
        />
      )
    }
  }
  // DEFAULT RETURN
  // 'error sphere' mesh object, with original model.name and props
  else {
    return (
      <mesh
        key={newUUID()}
        name={model.name}
        ref={model.ref}
        // // Click sets the mesh as the new target
        // onClick={(e) => (
        //   e.stopPropagation(),
        //   (modelVState.current = model.name),
        //   console.debug('modelVState.current', model.name),
        //   console.debug('snap.current', snap.current)
        // )}
        // // If a click happened but this mesh wasn't hit we null out the target,
        // // This works because missed pointers fire before the actual hits
        // onPointerMissed={(e) => (
        //   e.type === 'click',
        //   (modelVState.current = null),
        //   console.debug('modelVState.current', null),
        //   console.debug('snap.current', snap.current)
        // )}
        // // Right click cycles through the transform ThreeD.actionModes
        // onContextMenu={(e) =>
        //   snap.current === model.name &&
        //   (e.stopPropagation(),
        //   (modelVState.mode = (snap.mode + 1) % ThreeD.actionModes.length),
        //   console.debug('modelVState.mode', modelVState.mode),
        //   console.debug('snap.current', snap.current))
        // }
        // onPointerOver={(e) => (e.stopPropagation(), setIsHovered(true))}
        // onPointerOut={(e) => setIsHovered(false)}
        position={[-4, 0, 4]} // put in front of center:center, for easier viewing
        dispose={null}
      >
        <sphereGeometry args={[3, 96]} />
        <meshPhysicalMaterial
          color={model.is.isGLTF ? 'darkRed' : model.is.isOBJ ? 'darkOrange' : model.is.isFBX ? 'darkGreen' : 'darkPink'}
        />
      </mesh>
    )
  }
}

// Controls
function ThreeDControls() {
  // **
  // get Reactive state on each model (using valtio)
  const modelVState = proxy({ current: null, mode: 0 })
  // get Apollo Stores state
  // const storeState = undefined
  const sceneState = useThree((sceneState) => sceneState.scene)
  if (sceneState) {
    if (debug || DEBUG) console.debug('%c sceneState to load to ThreeDCanvas', ccm.yellow, sceneState)
    if (sceneState.length) {
      // if (debug) console.debug('sceneState.length', sceneState.length)
    }
  }

  // Get 'snap' notified on changes to modelVState + sceneState
  const snap = useSnapshot(modelVState)

  return (
    <group>
      {/* As of drei@7.13 transform-controls can refer to the target by children, or the object prop */}
      {snap.current && (
        <TransformControls
          object={sceneState.getObjectByName(snap.current)}
          mode={ThreeD.actionModes[snap.mode]}
        />
      )}
    </group>
  )
}

// ===============================================================
// EXAMPLE -- LOOP OVER ARRAY OF NODES TO CREATE INDIVIDUAL MODELS
// **
// interface IThreeD {
//   name: string
//   threedId: number
// }
// export const Elements = (props: { threeds: Array<IThreeD> }) => {
//   return (
//     <>
//       {props.threeds.map((_threed: IThreeD) => <h1>{_threed.name} | {_threed.threedId}</h1>)}
//     </>
//   )
// }
// export default const ElementCaller = () => {
//   var threedsArray: IThreeD[] = []
//   return (<Elements threeds={threedsArray} />)
// }

// ===============================================================
// **
export default function ThreeDModels({ threeds }) {
  // **
  console.debug(`%c======================================`, ccm.red)
  console.debug('%c🌱 threeds[]', ccm.red, threeds)
  console.debug(`%c======================================`, ccm.red)
  // **

  // return <CoffeeCup />
  return (
    <group>
      {/* <CoffeeCup /> */}
      {/* <ThreeDControls /> */}
      {/* THREED: LOOP OVER NODES FOR EACH FILE = MODEL */}
      {threeds.map((_threed, index) => {
        // console.debug('_threed', index + ': ', _threed)
        // console.debug(`%c======================================`, ccm.red)
        const threed = new ThreeD()
        threed.name = _threed.title
        threed.data = _threed
        // threed.group = threed.group
        threed.group.group_position = [_threed.positionX, _threed.positionY, _threed.positionZ]
        threed.group.group_rotation = [_threed.rotationX, _threed.rotationY, _threed.rotationZ]
        threed.group.group_scale = [_threed.scaleX, _threed.scaleY, _threed.scaleZ]
        return (
          <group
            // key={newUUID()}
            // key={index}
            key={threed.group.group_id} // no duplicates
            // ref={ref}
            // position={threed.group.group_position}
            // rotation={threed.group.group_rotation}
            // scale={threed.group.group_scale}
          >
          {_threed.files.nodes.map((_file, index) => {
            // console.debug('_file', index + ': ', _file)
            // console.debug(`%c======================================`, ccm.red)

            // const threed = new ThreeD()
            // threed.name = _file.title
            threed.file = _file
            // threed.group = threed.group

            return (
              <Model
                // key={_file.fileId} // no, duplicates
                // key={newUUID()}
                key={index}
                threed={threed}
              />
            )
          })}
          </group>
        )
      })}
    </group>
  )
}
