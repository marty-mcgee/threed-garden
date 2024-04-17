// 'use client'
// ==========================================================
// RESOURCES

export default function Lights() {
  return (
    <>
      {/* <directionalLight
        intensity={0.7}
        color={'#FFFFED'}
        castShadow
        shadow-bias={-0.0004}
        position={[-20, 20, 20]}
        shadow-camera-top={20}
        shadow-camera-right={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
      /> */}

      {/* <ambientLight intensity={0.2} /> */}
      <ambientLight intensity={0.5} />

      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        shadow-mapSize={[512, 512]}
        castShadow
      />

      <directionalLight
        castShadow
        position={[2.5, 5, 5]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera
          attach='shadow-camera'
          args={[-5, 5, 5, -5, 1, 50]}
        />
      </directionalLight>

      <pointLight
        position={[100, 100, 100]}
        intensity={0.8}
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
