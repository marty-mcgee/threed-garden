'use client'

import { forwardRef, Suspense, useImperativeHandle, useRef } from 'react'
import { OrbitControls, PerspectiveCamera, View as ThreeDViewer } from '@react-three/drei'
import { ThreedIO } from '@/lib/threed/helpers/components/ThreedIO'

// export const Common = ({ color }) => (
//   <Suspense fallback={null}>
//     {color && <color attach='background' args={[color]} />}
//     <ambientLight />
//     <pointLight position={[20, 30, 10]} intensity={3} decay={0.2} />
//     <pointLight position={[-10, -10, -10]} color='blue' decay={0.2} />
//     <PerspectiveCamera makeDefault fov={40} position={[0, 0, 6]} />
//   </Suspense>
// )

const ExperienceViewer = forwardRef(({ children, orbit, ...props }, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <ThreedIO>
        <ThreeDViewer track={localRef}>

          <ThreeDExperience />
          {children}
          {orbit && <OrbitControls />}
        </ThreeDViewer>
      </ThreedIO>
    </>
  )
})
ExperienceViewer.displayName = 'View'

export { ExperienceViewer }
