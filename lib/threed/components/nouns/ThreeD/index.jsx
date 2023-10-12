import { proxy, useSnapshot } from 'valtio'
import { useState, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { ContactShadows, useCursor, useGLTF, useFBX, useOBJ } from '@react-three/drei'

import Model from '#/lib/threed/components/nouns/Model'
// import Scene from '#/lib/threed/components/nouns/Scene/FarmDemo'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// ** NOTES

// radian (symbol rad) is the standard unit of angular measure.
// radian is determimed by the circumference of a circle that is equal in length to the radius of the circle.
// 1.570796 radians = 90 degrees | -1.570796 = -90 degrees
// in relation to the base unit of [angle] => (radians), 1 Quadrants (quad) is equal to 1.570796 radians, while 1 Radians (rad) = 1 radians.

// ==============================================================
// ** VARIABLES

// Model interactive "modes" using TransformControls
// const modes = ['translate', 'rotate', 'scale']

// defaults
const defaults = {
  //
  // group settings

  // rotation: 1.570796 radians = 90 degrees
  groupRotationDefault: [-1.570796, 0, 0], // [0, 0, 0],

  //
  // file settings

  // fbx | obj | gltf
  fileTypeDefault: 'ext', // ext[ension],

  // set a default file to load for Model (for testing)
  // fileUrlDefault: '/objects/examples/compressed.glb' | '/objects/examples/compressed-v002.glb' |
  fileUrlDefault:
    'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Demo/Polygon_Farm_Demo_FBX.fbx',
  // 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/Characters/SK_Chr_Farmer_Male_01.fbx',
  // 'https://threedpublic.s3.us-west-2.amazonaws.com/assets/threeds/synty/polygon/farm/FBX/SM_Prop_Bed_01.fbx',

  fileNameDefault: 'NounTitleFromAPI.ext',

  //
  // node settings

  // Table | Rocket003 | Headphones | DNA | Curly | Notebook | Roundcube001 | VR_Headset | Zeppelin
  nodeNameDefault: 'Demo Farm: McGee Ranch',

  // rotation: 1.570796 radians = 90 degrees
  nodeRotationDefault: [1.570796, 0, 0], // [0, 0, 0],
}

// ==============================================================
// ** COMPONENTS

const ThreeD = (props) => {
  // **
  // deconstruct arguments from props
  // const { ref, state, threed, name, file, doReturnOne, doReturnEach, doReturnAll } = props
  const { state, threedId, threed } = props

  console.debug('THREED: ThreeD(state, threedId, threed)', state, threedId, threed)

  // map threed to THREED, to pass on to Model
  const THREED = {
    // === threed
    name: 'THREED YAY -- HEY HEY HEY',
    // { data: 'gql/rest wp endpoint {threed_threed}' }
    group: {
      group_id: 0,
      group_position: [0, 0, 0],
      group_rotation: defaults.groupRotationDefault,
      group_scale: 0.05, // 0.01 | 0.05 | 0.5 | 1.0 | 5.0 | 50.0 | 100.0
    },
    // { data: 'gql/rest wp endpoint {threed_threed}' }
    // { data: 'gql/rest wp endpoint {threed_file}' }
    files: [
      {
        file_type: defaults.fileTypeDefault,
        file_loader: 'fbx|obj|gltf',
        file_url: defaults.fileUrlDefault,
        file_name: defaults.fileNameDefault,
        // { data: 'gql/rest wp endpoint {threed_threed}' }
        nodes: [
          {
            node_name: defaults.nodeNameDefault,
            node_position: [0, 0, 0],
            node_rotation: defaults.nodeRotationDefault,
            node_scale: 1.0, // 0.01 | 0.05 | 0.5 | 1.0 | 5.0 | 50.0 | 100.0
          },
        ],
      },
    ],
  }
  console.debug('THREED ready for Group of Models: ', THREED)

  // return R3F JSX
  return (
    <>
      <group
        position={THREED.group.group_position}
        rotation={THREED.group.group_rotation}
        scale={THREED.group.group_scale}>
        <Model
          state={state}
          threed={THREED}
          file={THREED.files[0].file_url}
          name={THREED.files[0].nodes[0].node_name}
          position={THREED.files[0].nodes[0].node_position}
          rotation={THREED.files[0].nodes[0].node_rotation}
          scale={THREED.files[0].nodes[0].node_scale}
          doReturnOne={true}
          doReturnEach={false}
          doReturnAll={false}
        />
        {/* <Scene /> */}
        <ContactShadows
          rotation-x={Math.PI / 2}
          position={[0, -35, 0]}
          opacity={0.25}
          width={200}
          height={200}
          blur={1}
          far={50}
        />
      </group>
      {/*
      <group position={[0, 10, 0]}>
        <Model name='Curly' position={[1, -11, -20]} rotation={[2, 0, -0]} />
        <Model name='DNA' position={[20, 0, -17]} rotation={[1, 1, -2]} />
        <Model name='Headphones' position={[20, 2, 4]} rotation={[1, 0, -1]} />
        <Model name='Notebook' position={[-21, -15, -13]} rotation={[2, 0, 1]} />
        <Model name='Rocket003' position={[18, 15, -25]} rotation={[1, 1, 0]} />
        <Model name='Roundcube001' position={[-25, -4, 5]} rotation={[1, 0, 0]} scale={0.5} />
        <Model name='Table' position={[1, -4, -28]} rotation={[1, 0, -1]} scale={0.5} />
        <Model name='VR_Headset' position={[7, -15, 28]} rotation={[1, 0, -1]} scale={5} />
        <Model name='Zeppelin' position={[-20, 10, 10]} rotation={[3, -1, 3]} scale={0.005} />
      </group>
      */}
    </>
  )
}

export default ThreeD
