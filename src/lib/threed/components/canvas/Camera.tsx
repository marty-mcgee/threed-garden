// 'use client'
// ==========================================================
// RESOURCES

import {
  PerspectiveCamera,
  OrthographicCamera,
  // Circle, Billboard, 
  // Text, Image, 
  // Clouds, Cloud, 
  // Detailed, 
  // Sphere,
} from "@react-three/drei"

/* eslint-disable react-refresh/only-export-components */
import { findIndex } from "lodash"
// import { Config } from "#/lib/farmbot/threed-farmbot/config-threed"
import { threeSpace, zDir, zZero } from "#/lib/farmbot/threed-farmbot/helpers"
// import { VectorXyz, getCamera } from "#/lib/farmbot/threed-farmbot/zoom_beacons_constants-threed"
// ** React Spring
import { 
  useSpring, 
  animated 
} from '@react-spring/three'

// ** THREED Config Type
import {
  type Config
} from "#/lib/farmbot/threed-farmbot/config-threed"
import { 
  FOCI, 
  getCamera,
  getCameraOffset, 
  getFocus,
  setUrlFocusParam, 
} from "#/lib/farmbot/threed-farmbot/zoom_beacons_constants-threed"

// ** TYPES + INTERFACES
type VectorXyz = [x: number, y: number, z: number]

interface Camera {
  position: VectorXyz
  target: VectorXyz
}

interface Focus {
  label: string
  info: {
    description: React.ReactElement
    position: VectorXyz
    scale: number
  }
  position: VectorXyz
  camera: {
    narrow: Camera
    wide: Camera
  }
}


// const { config } = props
// const groundZ = config.bedZOffset + config.bedHeight
// const Camera = config.perspective ? PerspectiveCamera : OrthographicCamera
const Camera = true ? PerspectiveCamera : OrthographicCamera


// ** ==================================
// ** THREED CAMERA
export default function ThreeDCamera(
  { 
    config, 
    activeFocus 
  }: { 
    config: Config, 
    activeFocus: string 
  }
) {

  const initCamera: { position: VectorXyz, target: VectorXyz } = {
    // position: isXL ? [7500, -3500, 3200]
    // position: [5000, -2500, 3200], // Small screens
    // position: [2200, -3500, 2000], // Large screens
    position: [-640, 320, 640],
    target: [0, 0, 0],
  }
  const camera = getCamera(config, activeFocus, initCamera)
  console.debug('camera', camera)
  // const camera = Camera
  // const camera = 

  // ** SPRING
  // const isXL = true // config.sizePreset == "Gen XL"
  // const { scale } = useSpring({
  //   scale: isXL ? 1.75 : 1,
  //   config: {
  //     tension: 300,
  //     friction: 40,
  //   },
  // })

  return (
    <>
      {/* <perspectiveCamera
        // attach='shadow-camera'
        // args={[-5, 5, 5, -5, 1, 50]}
      /> */}
      {/* <animated.group scale={activeFocus ? 1 : scale}> */}
        <Camera 
          makeDefault={true} 
          name={"camera"}
          fov={64} 
          near={0.10} 
          far={80000}
          position={camera.position}
          // rotation={[0, 0, 0]}
          // up={[0, 0, 0]}
        />
      {/* </animated.group> */}
    </>
  )
}
  