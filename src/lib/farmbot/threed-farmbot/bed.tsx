// @ts-nocheck /* OR @ ts-expect-error */

import { Box, Detailed, Extrude } from "@react-three/drei";
import {
  DoubleSide, Path, Shape, TextureLoader, RepeatWrapping,
} from "three";
import { range } from "lodash";
import { threeSpace, zZero, getColorFromBrightness } from "./helpers";
import { Config, detailLevels } from "./config";
import { ASSETS } from "./constants-threed";
import { DistanceIndicator } from "./distance_indicator";
import { FarmBotAxes } from "./farmbot_axes";
import { FarmBotPackaging } from "./packaging";
import { Caster } from "./caster";
import { UtilitiesPost } from "./utilities_post";

const soil = (
  Type: typeof Path | typeof Shape,
  botSize: Record<"x" | "y" | "z" | "thickness", number>,
): Path | Shape => {
  const { x, y, thickness } = botSize;

  const hole = new Type();
  hole.moveTo(thickness, thickness);
  hole.lineTo(thickness, y - thickness);
  hole.lineTo(x - thickness, y - thickness);
  hole.lineTo(x - thickness, thickness);
  hole.lineTo(thickness, thickness);
  return hole;
}

const bedStructure2D = (
  botSize: Record<"x" | "y" | "z" | "thickness", number>,
) => {
  const { x, y } = botSize;
  const shape = new Shape();

  // outer edge
  shape.moveTo(0, 0);
  shape.lineTo(0, y);
  shape.lineTo(x, y);
  shape.lineTo(x, 0);
  shape.lineTo(0, 0);

  // inner edge
  shape.holes.push(soil(Path, botSize));

  return shape;
}

const woodTexture = new TextureLoader()
  .load(ASSETS.textures.wood,
    texture => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(.0003, .003);
    });

const legWoodTexture = new TextureLoader()
  .load(ASSETS.textures.wood,
    texture => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(.02, .05);
    });

const soilTexture = new TextureLoader()
  .load(ASSETS.textures.soil,
    texture => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(.00017, .00034);
    });

interface BedProps {
  config: Config;
}

export const Bed = (props: BedProps) => {
  const {
    bedWidthOuter, bedLengthOuter, botSizeZ, bedHeight, bedZOffset,
    legSize, legsFlush, extraLegsX, extraLegsY, bedBrightness, soilBrightness,
    soilHeight, ccSupportSize, axes, xyDimensions,
  } = props.config;
  const thickness = props.config.bedWallThickness;
  const botSize = { x: bedLengthOuter, y: bedWidthOuter, z: botSizeZ, thickness };
  const bedStartZ = bedHeight;
  const bedColor = getColorFromBrightness(bedBrightness);
  const soilColor = getColorFromBrightness(soilBrightness);
  const groundZ = -bedHeight - bedZOffset;
  const legXPositions = [
    0 + legSize / 2 + thickness,
    ...(extraLegsX
      ? range(0, bedLengthOuter, bedLengthOuter / (extraLegsX + 1)).slice(1)
      : []),
    bedLengthOuter - legSize / 2 - thickness,
  ];
  const legYPositions = (index: number) =>
    [
      0 + legSize / 2 + thickness,
      ...(extraLegsY && (index == 0 || index == (legXPositions.length - 1))
        ? range(0, bedWidthOuter, bedWidthOuter / (extraLegsY + 1)).slice(1)
        : []),
      bedWidthOuter - legSize / 2 - thickness,
    ];
  const casterHeight = legSize * 1.375;

  const Bed = ({ children }: { children: React.ReactElement }) =>
    <Extrude name={"bed"}
      castShadow={true}
      receiveShadow={true}
      args={[
        bedStructure2D(botSize),
        { steps: 1, depth: bedHeight, bevelEnabled: false },
      ]}
      position={[
        threeSpace(0, bedLengthOuter),
        threeSpace(0, bedWidthOuter),
        -bedStartZ,
      ]}>
      {children}
    </Extrude>;

  const Soil = ({ children }: { children: React.ReactElement }) => {
    const soilDepth = bedHeight + zZero(props.config) - soilHeight;
    return <Extrude name={"soil"}
      castShadow={true}
      receiveShadow={true}
      args={[
        soil(Shape, botSize) as Shape,
        { steps: 1, depth: soilDepth, bevelEnabled: false },
      ]}
      position={[
        threeSpace(0, bedLengthOuter),
        threeSpace(0, bedWidthOuter),
        -bedStartZ,
      ]}>
      {children}
    </Extrude>;
  };

  return <group>
    <Detailed distances={detailLevels(props.config)}>
      <Bed>
        <meshPhongMaterial map={woodTexture} color={bedColor} side={DoubleSide} />
      </Bed>
      <Bed>
        <meshPhongMaterial color={"#ad7039"} side={DoubleSide} />
      </Bed>
    </Detailed>
    <group visible={xyDimensions}>
      <DistanceIndicator
        start={{
          x: threeSpace(0, bedLengthOuter),
          y: threeSpace(0, bedWidthOuter) - 100,
          z: groundZ,
        }}
        end={{
          x: threeSpace(bedLengthOuter, bedLengthOuter),
          y: threeSpace(0, bedWidthOuter) - 100,
          z: groundZ,
        }} />
      <DistanceIndicator
        start={{
          x: threeSpace(bedLengthOuter, bedLengthOuter) + 100,
          y: threeSpace(0, bedWidthOuter),
          z: groundZ,
        }}
        end={{
          x: threeSpace(bedLengthOuter, bedLengthOuter) + 100,
          y: threeSpace(bedWidthOuter, bedWidthOuter),
          z: groundZ,
        }} />
    </group>
    <group visible={axes}>
      <FarmBotAxes config={props.config} />
    </group>
    <Box name={"lower-cc-support"}
      castShadow={true}
      receiveShadow={true}
      args={[bedLengthOuter / 2, ccSupportSize, ccSupportSize]}
      position={[
        threeSpace(bedLengthOuter / 4, bedLengthOuter),
        threeSpace(-ccSupportSize / 2, bedWidthOuter),
        -Math.min(150, bedHeight / 2) - ccSupportSize / 2,
      ]}>
      <meshPhongMaterial map={legWoodTexture} color={bedColor} side={DoubleSide} />
    </Box>
    <Box name={"upper-cc-support"}
      castShadow={true}
      receiveShadow={true}
      args={[bedLengthOuter / 2, ccSupportSize, ccSupportSize]}
      position={[
        threeSpace(bedLengthOuter * 3 / 4, bedLengthOuter),
        threeSpace(-ccSupportSize / 2, bedWidthOuter),
        -50 - ccSupportSize / 2,
      ]}>
      <meshPhongMaterial map={legWoodTexture} color={bedColor} side={DoubleSide} />
    </Box>
    <Detailed distances={detailLevels(props.config)}>
      <Soil>
        <meshPhongMaterial map={soilTexture} color={soilColor}
          shininess={0} />
      </Soil>
      <Soil>
        <meshPhongMaterial color={"#29231e"}
          shininess={0} />
      </Soil>
    </Detailed>
    {legXPositions.map((x, index) =>
      <group key={index}>
        {legYPositions(index).map(y =>
          <group name={"bed-leg"} key={y}
            position={[
              threeSpace(x, bedLengthOuter),
              threeSpace(y, bedWidthOuter),
              -bedZOffset / 2 - (legsFlush ? bedHeight / 2 : bedHeight) + (casterHeight / 2),
            ]}>
            <Box name={"bed-leg-wood"}
              castShadow={true}
              receiveShadow={true}
              args={[
                legSize,
                legSize,
                bedZOffset + (legsFlush ? bedHeight : 0) - casterHeight
              ]}>
              <meshPhongMaterial map={legWoodTexture} color={bedColor} />
            </Box>
            <Caster config={props.config} />
          </group>)}
      </group>
    )}
    <UtilitiesPost config={props.config} />
    <FarmBotPackaging config={props.config} />
  </group>;
};
