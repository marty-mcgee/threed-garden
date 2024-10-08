// 'use client'
// ==========================================================
// RESOURCES

export default function Lights() {
  return (
    <>
      <directionalLight
        castShadow
        position={[2.5, 5, 5]}
        intensity={2.4}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-top={20}
        shadow-camera-right={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
        // color={'#FFFFED'}
      >
        {/* <orthographicCamera
          attach='shadow-camera'
          args={[-5, 5, 5, -5, 1, 50]}
        /> */}
      </directionalLight>
      {/* <directionalLight
        castShadow
        position={[2.5, 5, 5]}
        intensity={2.4}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-top={20}
        shadow-camera-right={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
        // color={'#FFFFED'}
      >
        <orthographicCamera
          attach='shadow-camera'
          args={[-5, 5, 5, -5, 1, 50]}
        />
      </directionalLight> */}

      {/* <ambientLight intensity={0.2} /> */}
      <ambientLight intensity={0.5} />
      <ambientLight intensity={0.5} />
      <ambientLight intensity={0.1} />

      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        shadow-mapSize={[512, 512]}
        castShadow
      />
      {/* <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        shadow-mapSize={[512, 512]}
        castShadow
      /> */}

      <pointLight
        position={[100, 100, 100]}
        intensity={0.8}
      />
      {/* <pointLight
        position={[100, 100, 100]}
        intensity={0.8}
      /> */}
      
      <hemisphereLight
        color='#ffffff'
        groundColor='#b9b9b9'
        position={[-7, 25, 13]}
        intensity={0.85}
      />
      <hemisphereLight
        color='#ffffff'
        groundColor='#b9b9b9'
        position={[-7, 25, 13]}
        intensity={0.85}
      />

    </>
  )
}
