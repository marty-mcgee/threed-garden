import { useRef, useEffect, useState } from "react"
// import * as THREE from "three"
import { Canvas, useFrame } from '@react-three/fiber'

const MyComponent = () => {
  useEffect(() => {
    console.log('MyComponent onMount')
    return () => {
      console.log('MyComponent onUnmount')
    }
  }, [])
  return (
    <div>My Component (returns) JSX here...</div>
  )
}

const ThreeDGarden = (): JSX.Element => {
  const word = "HEY HEY HEY"
  const title = useRef()
  // const root = useRef()
  // const scene = new THREE.Scene()
  useEffect(() => {
    console.log('ThreeDGarden onMount')
    // bootManager()
    return () => {
      console.log('ThreeDGarden onUnmount')
    }
  }, [])
  return (
    <div>
      <div ref={title}>ThreeDGarden: {word}</div>
      {/* <div ref={root}>Three root</div> */}
      <MyComponent />
      <div id="canvas-container" style={{ height: '50vh', width: '100vw' }}>
        {/* @ts-ignore */}
        <Canvas>
          <mesh>
            <boxBufferGeometry />
            <meshBasicMaterial />
          </mesh>
        </Canvas>
      </div>
    </div>
  )
}

export default ThreeDGarden
