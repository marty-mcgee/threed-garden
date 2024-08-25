// @ts-nocheck /* OR @ ts-expect-error */

import { Box, Billboard, Image, Extrude } from "@react-three/drei"
import { DoubleSide, Shape, TextureLoader, RepeatWrapping } from "three"
import { ASSETS } from "./constants-threed"
import { threeSpace } from "./helpers"
import { Config } from "./config-threed"
import { Desk } from "./desk-threed"

interface LabProps {
  config: Config
  activeFocus: string
}

const woodTexture = new TextureLoader()
  .load(ASSETS.textures.wood,
    texture => {
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.repeat.set(.3, .3)
    })

const wallLength = 10000
const wallHeight = 2500
const wallThickness = 200
const wallOffset = 2000
const wallColor = "#f4f4f4"
const shelfThickness = 50

const wallStructure2D = () => {
  const shape = new Shape()

  shape.moveTo(0, 0)
  shape.lineTo(wallLength, 0)
  shape.lineTo(wallLength, wallThickness)
  shape.lineTo(-wallThickness, wallThickness)
  shape.lineTo(-wallThickness, -wallLength)
  shape.lineTo(0, -wallLength)
  shape.lineTo(0, 0)

  return shape
}

export const LabEnvironment = (props: LabProps) => {
  const { config } = props
  const groundZ = -config.bedZOffset - config.bedHeight
  return (
    <group name={"lab-environment"} visible={config.lab}>
      <group
        name={"lab-walls"}
        position={[
          threeSpace(-wallOffset, config.bedLengthOuter),
          threeSpace(wallOffset, -config.bedWidthOuter),
          groundZ,
        ]}>
        <Extrude
          name={"walls"}
          castShadow={true}
          receiveShadow={true}
          args={[
            wallStructure2D(),
            { steps: 1, depth: wallHeight, bevelEnabled: false },
          ]}>
          <meshPhongMaterial color={wallColor} side={DoubleSide} />
        </Extrude>
        {[wallHeight / 2, wallHeight / 3].map((shelfHeight, index) => (
          <Box
            name={"shelf"}
            key={index}
            castShadow={true}
            receiveShadow={true}
            args={[wallLength, wallThickness, shelfThickness]}
            position={[
              wallLength / 2,
              -wallThickness / 2,
              shelfHeight,
            ]}>
            <meshPhongMaterial
              map={woodTexture}
              color={"#999"}
              side={DoubleSide} />
          </Box>
        ))}
      </group>
      
      <Desk config={config} activeFocus={props.activeFocus} />

      <group 
        name={"people"}
        visible={config.people && props.activeFocus == ""}
      >
        <Billboard
          position={[
            threeSpace(-300, config.bedLengthOuter),
            threeSpace(-300, config.bedWidthOuter),
            groundZ,
          ]}>
          <Image
            url={ASSETS.people.person1Flipped}
            position={[0, 900, 0]}
            scale={[900, 1800]}
            transparent={true}
            opacity={0.4}
            renderOrder={1}/>
        </Billboard>
        <Billboard
          position={[
            0,
            threeSpace(500, -config.bedWidthOuter),
            groundZ,
          ]}>
          <Image
            url={ASSETS.people.person2Flipped}
            position={[0, 850, 0]}
            scale={[700, 1700]}
            transparent={true}
            opacity={0.4}
            renderOrder={1}/>
        </Billboard>
      </group>
    </group>
  )
}
