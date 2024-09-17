import { Suspense, useMemo } from 'react'
import Bird from './Bird'

export default function Birds() {
  const birds = useMemo(
    () =>
      new Array(10).fill().map((_, index) => {
        const x =
          (15 + Math.random() * 30) * (Math.round(Math.random()) ? -1 : 1)
        const y = -10 + Math.random() * 10
        const z = -5 + Math.random() * 10
        const bird = ['stork', 'parrot', 'flamingo'][
          Math.round(Math.random() * 2)
        ]
        const speed = bird === 'stork' ? 0.5 : bird === 'flamingo' ? 2.5 : 5
        const factor =
          bird === 'stork'
            ? 0.5 + Math.random()
            : bird === 'flamingo'
            ? 0.25 + Math.random()
            : 1 + Math.random() - 0.5

        return {
          key: index,
          position: [x, y, z],
          rotation: [0, x > 0 ? Math.PI : 0, 0],
          speed,
          factor,
          url: `./objects/glb/${bird}.glb`,
        }
      }),
    []
  )

  return (
      <Suspense fallback={null}>
        {birds.map((props) => (
          <Bird {...props} key={props.key} />
        ))}
      </Suspense>
  )
}
