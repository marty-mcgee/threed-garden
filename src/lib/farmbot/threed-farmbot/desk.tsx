// @ts-nocheck /* OR @ ts-expect-error */

import { TextureLoader, RepeatWrapping } from "three";
import { Box } from "@react-three/drei";
import { ASSETS } from "./constants-threed";
import { threeSpace } from "./helpers";
import { Config } from "./config";

interface DeskProps {
  config: Config;
}

const deskWidth = 1000;
const deskDepth = 500;
const deskHeight = 550;
const deskOffset = 800;
const deskLegWidth = 50;
const deskWoodDarkness = "#666";

const woodTexture = new TextureLoader()
  .load(ASSETS.textures.wood,
    texture => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(0.3, 0.3);
    }
  );

export const Desk = (props: DeskProps) => {
  const { config } = props;
  const zGround = -config.bedZOffset - config.bedHeight;
  return (
    <group
    name={"desk"}
    position={[
      threeSpace(deskOffset, -config.bedLengthOuter),
      0,
      zGround,
    ]}>
    <Box
      name={"desk-top"}
      castShadow={true}
      receiveShadow={true}
      args={[deskDepth, deskWidth, 50]}
      position={[0, 0, deskHeight + 25]}>
      <meshPhongMaterial map={woodTexture} color={deskWoodDarkness} />
    </Box>
    <group name={"desk-legs"}>
      {[
        [(-deskDepth + deskLegWidth) / 2, (-deskWidth + deskLegWidth) / 2],
        [(-deskDepth + deskLegWidth) / 2, (deskWidth - deskLegWidth) / 2],
        [(deskDepth - deskLegWidth) / 2, (-deskWidth + deskLegWidth) / 2],
        [(deskDepth - deskLegWidth) / 2, (deskWidth - deskLegWidth) / 2],
      ].map(([xOffset, yOffset], index) =>
        <Box
          name={"desk-leg"}
          key={index}
          castShadow={true}
          receiveShadow={true}
          args={[deskLegWidth, deskLegWidth, deskHeight]}
          position={[xOffset, yOffset, deskHeight / 2]}>
          <meshPhongMaterial map={woodTexture} color={deskWoodDarkness} />
        </Box>
      )}
    </group>
  </group>
  );
};
