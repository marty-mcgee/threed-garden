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

// ** THREED Config Type
import {
  type Config,
} from "#/lib/farmbot/threed-farmbot/config-threed"
import { 
  FOCI, 
  getCamera,
  getCameraOffset, 
  getFocus,
  setUrlFocusParam, 
  type VectorXyz,
} from "#/lib/farmbot/threed-farmbot/zoom_beacons_constants-threed"

// const { config } = props
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
    
    // position={camera.position}
    // position: [-640, 320, 640],
    // position: [640, 320, -640],
    // position: [-64, 32, 64],
    // position: [64, 32, -64],
    // position: [48, 16, -64], // pre-deepseek
    // position: [4.8, 1.6, -6.4],
    // position: [20.0, 10.0, -20.0],
    position: [-18.0, 10.0, 18.0],
    
    target: [-4.8, 0, 0],
    
    // // fov={64} // zoom
    // // fov={48} // zoom
    // // fov={32} // zoom
    // fov={24} // zoom
    // near={0.010} 
    // far={8000}
        // rotation={[0, 0, 0]}
        // up={[0, 0, 0]}
  }
  const camera = getCamera(config, activeFocus, initCamera)
  // console.debug('camera', camera)

  return (
    <>
      {/* <perspectiveCamera
        // attach='shadow-camera'
        // args={[-5, 5, 5, -5, 1, 50]}
      /> */}
      <Camera 
        makeDefault={true} 
        name={"camera"}
        // fov={64} // zoom
        // fov={48} // zoom
        // fov={32} // zoom
        fov={24} // zoom
        near={0.010} 
        far={8000}
        position={camera.position}
        // rotation={[0, 0, 0]}
        // up={[0, 0, 0]}
      />
    </>
  )
}
  