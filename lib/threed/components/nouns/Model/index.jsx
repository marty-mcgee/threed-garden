import { proxy, useSnapshot } from 'valtio'
import { useEffect, useState, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import {
  // ContactShadows,
  useCursor,
  useGLTF,
  useFBX,
  // useOBJ, // not supported
  useAnimations,
  useTexture
} from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
// import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { a, useSpring } from '@react-spring/three'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ** ThreeD Model -||-
const Model = (props) => {

  // **
  // deconstruct arguments from props
  const { state, threed, name, file, doReturnOne, doReturnEach, doReturnAll } = props
  console.debug('Model props', props)

  // ** set available action modes
  const modes = ['translate', 'rotate', 'scale']

  // Ties this component to the state model
  const snap = useSnapshot(state)

  // const doReturnAll = false // from function argument
  // console.debug('doReturnAll', doReturnAll)

  // this model = threed_threed.model -||-
  const model = {
    ref: useRef(null),
    state: state, // for funzees
    name: name,
    file: file ? file : '',
    // file type?
    type: 'threed', // fbx | gltf | obj | threed
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
    // file nodes
    nodes: {},
    // animations
    ani: {
      ref: null,
      actions: [],
      names: [],
    },
    doReturnOne: doReturnOne ? true : false,
    doReturnAll: doReturnAll ? true : false,
    doReturnEach: doReturnEach ? true : false,
    // attributes
    group_position: threed.group.position,
    group_rotation: threed.group.rotation,
    group_scale: threed.group.scale,
    // is Ready to go?
    isReady: false,
  }

  // ** decide file type from file extension (and other qualifiers)
  const fileExt = model.file.split('.').pop()
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
    console.debug('%cmodel.isSupported: true', ccm.green)
    console.debug(`%c====================================`, ccm.black)
    if (model.isObject3D) {
      // FBX
      if (model.isFBX) {
        // const { nodes, animations } = useFBX(model.file)
        const fbx = useFBX(model.file)
        console.debug('%cnodes: fbx', ccm.blue, fbx)
        console.debug(`%c====================================`, ccm.black)
        if (fbx) {
          model.nodes = fbx
          model.isReady = true
          // console.debug('RETURN ONLY NODE AS NODES: true')
        }
        if (fbx.animations) {
          console.debug('FBX animations', fbx.animations)
          // Extract animation actions
          const { ref, actions, names } = useAnimations(fbx.animations)
          console.debug('FBX useAnimations', ref, actions, names)
          model.ani.ref = ref
          model.ani.actions = actions
          model.ani.names = names
        }
      }
      // OBJ
      else if (model.isOBJ) {
        // const nodes = useOBJ(model.file)
        const nodes = new OBJLoader().load(model.file)
        console.debug('%cnodes: obj', ccm.blue, nodes)
        console.debug(`%c====================================`, ccm.black)
        if (nodes) {
          model.nodes = nodes
          model.isReady = true
          // console.debug('RETURN ONLY NODE AS NODES: true')
        }
      }
      // GLTF
      else if (model.isGLTF) {
        // nodes[] is an array of all the meshes
        // file is cached/memoized; it only gets loaded and parsed once
        // const file = '/objects/examples/compressed-v002.glb'
        const { nodes } = useGLTF(model.file)
        console.debug('%cnodes: gltf', ccm.blue, nodes)
        console.debug(`%c====================================`, ccm.black)
        if (nodes) {
          // FILTER (LOOP OVER) NODES {Object.keys}
          // to get the single node you are asking for
          if (model.doReturnAll) {
            model.nodes = nodes
            // console.debug('RETURN ALL NODES: true')
          }
          // OR RETURN ALL NODES, OR QUERY A LIST OF NODES you want...
          else {
            // for one node key requested...
            model.nodes[model.name] = nodes[model.name]
            // console.debug('RETURN ONE NODE: true', model.nodes[model.name])

            // OR...
            // console.debug('OR: ')
            // console.debug('RETURN EACH NODE: true')
            // // for each node key requested...
            // Object.keys(nodes).forEach((value, index, array) => {
            //   console.debug('RETURN EACH NODE by KEY: ', index, value)
            // })
          }
          model.isReady = true
        }
      }
    }
    // console.debug(`%c====================================`, ccm.black)
  } else {
    console.debug('%cmodel.isSupported: false', ccm.yellow)
    console.debug(`%c====================================`, ccm.black)
  }
  console.debug('%cmodel', ccm.green, model)
  console.debug(`%c====================================`, ccm.black)

  // ==============================================================

  // Feed hover state into useCursor, which sets document.body.style.cursor to pointer|auto
  const [isHovered, setIsHovered] = useState(false)
  useCursor(isHovered)
  const [index, setIndex] = useState(0)

  // Animate the selection halo
  const { color, scale } = useSpring({
    scale: isHovered ? [1.15, 1.15, 1] : [1, 1, 1],
    color: isHovered ? '#ff6d6d' : '#569AFF',
  })

  // Change cursor on hover-state
  useEffect(() => void (document.body.style.cursor = isHovered ? 'pointer' : 'auto'), [isHovered])

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
        return () => model.ani.actions[model.ani.names[index]].fadeOut(0.5)
      }

    return undefined
  }, [index, model.ani.actions, model.ani.names])

  // ==============================================================
  // ANIMATIONS (FOR ALL MODELS !!!)

  // useFrame(({ clock }) => {
  //   const a = clock.getElapsedTime()
  //   model.ref.current.rotation.x = a
  // })

  // ==============================================================
  // ** RETURN JSX

  if (model.isReady) {
    // console.debug(`%cdraw([nodes]): ${model.type}`, ccm.blue, model.nodes)
    // console.debug(`%c====================================`, ccm.black)
    // return GLTF node
    if (model.isGLTF) {
      const model_name = model.nodes[model.name].name
      const model_geometry = model.nodes[model.name].geometry
      const model_material = model.nodes[model.name].material
      return (
        <mesh
          name={model_name}
          ref={model.ref}
          // Click sets the mesh as the new target
          onClick={(e) => (e.stopPropagation(), (state.current = model_name))}
          // If a click happened but this mesh wasn't hit we null out the target,
          // This works because missed pointers fire before the actual hits
          onPointerMissed={(e) => e.type === 'click' && (state.current = null)}
          // Right click cycles through the transform modes
          onContextMenu={(e) =>
            snap.current === model_name && (e.stopPropagation(), (state.mode = (snap.mode + 1) % modes.length))
          }
          onPointerOver={(e) => (e.stopPropagation(), setIsHovered(true))}
          onPointerOut={(e) => setIsHovered(false)}
          geometry={model_geometry}
          material={model_material}
          material-color={snap.current === model_name ? '#ff7070' : '#ababab'}
          {...props}
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
          {...props}
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
        (state.current = model.name),
        console.debug('state.current', model.name),
        console.debug('snap.current', snap.current)
      )}
      // If a click happened but this mesh wasn't hit we null out the target,
      // This works because missed pointers fire before the actual hits
      onPointerMissed={(e) => (
        e.type === 'click',
        (state.current = null),
        console.debug('state.current', null),
        console.debug('snap.current', snap.current)
      )}
      // Right click cycles through the transform modes
      onContextMenu={(e) =>
        snap.current === model.name &&
        (e.stopPropagation(),
        (state.mode = (snap.mode + 1) % modes.length),
        console.debug('state.mode', state.mode),
        console.debug('snap.current', snap.current))
      }
      onPointerOver={(e) => (e.stopPropagation(), setIsHovered(true))}
      onPointerOut={(e) => setIsHovered(false)}
      {...props}
      dispose={null}>
      <sphereGeometry args={[4, 96]} />
      <meshPhysicalMaterial
        color={model.isGLTF ? 'darkRed' : model.isOBJ ? 'darkOrange' : model.isFBX ? 'darkGreen' : 'darkPink'}
      />
    </mesh>
  )
  // }
}

export default Model
