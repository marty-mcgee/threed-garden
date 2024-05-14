import ThreeDCharacter from '#/lib/threed/components/nouns/Character/Character'
import ThreeDModel from '#/lib/threed/components/nouns/Model/Model'
import ThreeDCoffeeCup from '#/lib/threed/components/examples/CoffeeCup/CoffeeCup'

import { PresentationControls } from '@react-three/drei'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

const ThreeDModels = (props) => {

  let jsx

  for (let Model; Model = 1; Model++) {
    jsx += <ThreeDModel threedid={1} />
  }

  return <>{jsx}</>
  // return {children}
}
// ** ThreeD -- Group of Model[s] -||-
// const Model = (props) => {
// function ThreeD({ state, threedId, threed, ...props }) {
const ThreeD = ({ threedid, state, threed, type, position, rotation, scale, children }) => {
  // return <></> // <div>ThreeD</div>
  return (
    <>
      {/* MODEL -- Monaco Watch
        auto-generated by: https://github.com/pmndrs/gltfjsx
        author: ar-watches (https://sketchfab.com/ar-watches)
        license: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
        source: https://sketchfab.com/3d-models/tag-heuer-monaco-x-gulf-watch-31ba7140fb3146b2af3cbdc13022421c
        title: Tag Heuer Monaco X GULF Watch
      */}
      {/* <PresentationControls
        // global
        config={{ mass: 2, tension: 500 }}
        snap={{ mass: 4, tension: 1500 }}
        rotation={[0, 0.3, 0]}
        polar={[-Math.PI / 3, Math.PI / 3]}
        azimuth={[-Math.PI / 1.4, Math.PI / 2]}>
        <Watch rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} scale={0.005} />
      </PresentationControls> */}
      {/* MODEL -- ThreeD Coffee Cup */}
      {/* <PresentationControls
        global
        config={{ mass: 2, tension: 500 }}
        snap={{ mass: 4, tension: 1500 }}
        rotation={[0, 0.3, 0]}
        polar={[-Math.PI / 3, Math.PI / 3]}
        azimuth={[-Math.PI / 1.4, Math.PI / 2]}
      >
        <ThreeDCoffeeCup position={[1.25, 1, 3.25]} scale={2.5} />
      </PresentationControls> */}

  <PresentationControls
    // global
    config={{ mass: 2, tension: 500 }}
    snap={{ mass: 4, tension: 1500 }}
    rotation={[0, 0.3, 0]}
    polar={[-Math.PI / 3, Math.PI / 3]}
    azimuth={[-Math.PI / 1.4, Math.PI / 2]}
  >
    {/* <StacyApp position={[1.25, 1, 3.25]} scale={3.0} /> */}
    {/* <Stacy position={[1.25, 0.7, 3.25]} scale={5.0} /> */}
    <ThreeDCharacter
      threedid={threedid}
      state={state}
      type={type}
      // threedId={threedId}
      // threed={threed}
      position={position}
      rotation={rotation}
      scale={scale}
    />
    {/* <ThreeDModel
      threedid={threedid}
      state={state}
      type={type}
      threed={threed}
      // threed={THREEDSCENE}
      // file={THREEDSCENE.files[0].file_url}
      // name={THREEDSCENE.files[0].nodes[0].node_name}
      // position={THREEDSCENE.files[0].nodes[0].node_position}
      // rotation={THREEDSCENE.files[0].nodes[0].node_rotation}
      // scale={THREEDSCENE.files[0].nodes[0].node_scale}

      // threedId={threedId}
      // threed={threed}
      position={position}
      rotation={rotation}
      scale={scale}
      // doReturnOne={true}
      // doReturnEach={false}
      // doReturnAll={false}
    /> */}

    {/* <ThreeDs
      state={state}
      threed={THREEDSCENE}
      file={THREEDSCENE.files[0].file_url}
      name={THREEDSCENE.files[0].nodes[0].node_name}
      position={THREEDSCENE.files[0].nodes[0].node_position}
      rotation={THREEDSCENE.files[0].nodes[0].node_rotation}
      scale={THREEDSCENE.files[0].nodes[0].node_scale}
      doReturnOne={true}
      doReturnEach={false}
      doReturnAll={false}
    /> */}

    {/* <>{children}</> */}

  </PresentationControls>
  </>
  )
}

export default ThreeD