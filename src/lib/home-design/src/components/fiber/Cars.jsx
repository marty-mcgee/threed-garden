import { Suspense } from 'react'
import BoundingBox from './BoundingBox'
import Model from './Model'
import Draggable from './Draggable'

const Cars = ({ }) => {
  return (
    <Suspense fallback={null}>
      <Draggable transformGroup>
        <BoundingBox
          position={[4, 4, 0]}
          dims={[3, 2, 6]}
          offset={[0, -0.4, 0.8]}
        >
          <Model
            path='/garage/tesla_model_3/scene.gltf'
            scale={new Array(3).fill(0.01)}
          />
        </BoundingBox>
      </Draggable>
      <Draggable transformGroup>
        <BoundingBox
          position={[-4, 4, 0]}
          dims={[3, 2, 7]}
          offset={[0, -0.8, 0.2]}
        >
          <Model
            path='/garage/tesla_model_s/scene.gltf'
            scale={new Array(3).fill(0.013)}
          />
        </BoundingBox>
      </Draggable>
      <Draggable transformGroup>
        <BoundingBox
          position={[-8, 0, 0]}
          dims={[3, 2, 7]}
          offset={[-4, -0.9, -0.4]}
        >
          <Model
            path='/garage/tesla_roadster_2020_interior/scene.gltf'
            scale={new Array(3).fill(2)}
          />
        </BoundingBox>
      </Draggable>

      <Draggable transformGroup >
        <Model
          path='/garage/old_gramophone/scene.gltf'
          scale={new THREE.Vector3(.05, .05, .05)}
          position={[0, 0, 3]}
        />
      </Draggable>
      <Draggable transformGroup>
        <BoundingBox
          dims={[3, 2, 6]}
        >
          <Model
            path='/garage/spectral_rubix/scene.gltf'
            scale={new THREE.Vector3(.3, .3, .3)}
            position={[0, 1, -5]}
          />
        </BoundingBox>
      </Draggable>
    </Suspense>
  )
}

export default Cars
