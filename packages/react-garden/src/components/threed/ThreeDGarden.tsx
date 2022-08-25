import { useRef, useEffect, useState } from "react"
// import * as THREE from "three"
import { Canvas, useFrame } from '@react-three/fiber'

const MyComponent = () => {
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
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
    console.debug('ThreeDGarden onMount')
    // bootManager()
    return () => {
      console.debug('ThreeDGarden onUnmount')
    }
  }, [])
  return (
    <div style={{ textAlign: "center" }}>
      <div ref={title}>ThreeDGarden: {word}</div>
      {/* <div ref={root}>Three root</div> */}
      <MyComponent />
      <div id="canvas-container">
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
