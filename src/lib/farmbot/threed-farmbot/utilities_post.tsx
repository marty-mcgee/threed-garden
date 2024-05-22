// @ts-nocheck /* OR @ ts-expect-error */

import { Box, Cylinder, RoundedBox, Tube } from "@react-three/drei";
import { TextureLoader, RepeatWrapping } from "three";
import { ASSETS } from "./constants";
import { Config } from "./config";
import { threeSpace, getColorFromBrightness, easyCubicBezierCurve3 } from "./helpers";
import { outletDepth } from "./power_supply";
import * as THREE from 'three';

interface UtilitiesPostProps {
  config: Config;
}

const WoodTexture = new TextureLoader()
  .load(ASSETS.textures.wood,
    texture => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(.02, .05);
    });

export const UtilitiesPost = (props: UtilitiesPostProps) => {
  const {
    utilitiesPost, legSize, bedLengthOuter, bedWidthOuter,
    bedBrightness, bedHeight, bedZOffset,
  } = props.config;
  const groundZ = -bedHeight - bedZOffset;
  const postColor = getColorFromBrightness(bedBrightness);
  const faucetX = 0;
  const faucetY = -115;
  const faucetZ = 70;
  const barbX = -bedLengthOuter / 2 - 200;
  const barbY = -100
  const barbZ = -130;

  const hosePathCurved = easyCubicBezierCurve3(
    [faucetX, faucetY, faucetZ],
    [0, -60, -65],
    [200, 0, 0],
    [faucetX - 205, barbY, barbZ],
  );

  const hosePathStraight = new THREE.LineCurve3(
    new THREE.Vector3(faucetX - 200, barbY, barbZ),
    new THREE.Vector3(barbX, barbY, barbZ),
  );

  return <group name={"utilities"}
    visible={utilitiesPost}
    position={[
      threeSpace(600, -bedLengthOuter),
      threeSpace(legSize / 2, bedWidthOuter),
      groundZ + 150,
    ]}>
    <Box name={"utilities-post"}
      castShadow={true}
      args={[legSize, legSize, 300]}>
      <meshPhongMaterial map={WoodTexture} color={postColor} />
    </Box>
    <Cylinder name={"pipe"}
      castShadow={true}
      receiveShadow={true}
      args={[outletDepth / 2, outletDepth / 2, 200]}
      position={[-legSize / 2 - outletDepth / 2, 0, -50]}
      rotation={[Math.PI / 2, 0, 0]}>
      <meshPhongMaterial color={"gray"} />
    </Cylinder>
    <Box name={"electrical-outlet"}
      castShadow={true}
      args={[outletDepth, 75, 110]}
      position={[-legSize / 2 - outletDepth / 2, 0, 85]}>
      <meshPhongMaterial color={"gray"} />
    </Box>
    <group name={"wifi-router"}
      position={[0, 0, 165]}>
      <RoundedBox name={"router-base"}
        castShadow={true}
        receiveShadow={true}
        radius={8}
        args={[legSize, 60, 30]}>
        <meshPhongMaterial color={"lightgray"} />
      </RoundedBox>
      <Cylinder name={"antenna-1"}
        castShadow={true}
        receiveShadow={true}
        args={[3.5, 3.5, 60]}
        position={[-30, 0, 35]}
        rotation={[Math.PI / 2, 0, Math.PI / 8]}>
        <meshPhongMaterial color={"gray"} />
      </Cylinder>
      <Cylinder name={"antenna-2"}
        castShadow={true}
        receiveShadow={true}
        args={[3.5, 3.5, 60]}
        position={[30, 0, 35]}
        rotation={[Math.PI / 2, 0, -Math.PI / 8]}>
        <meshPhongMaterial color={"gray"} />
      </Cylinder>
      <Cylinder name={"led-light-1"}
        castShadow={true}
        receiveShadow={true}
        args={[2, 2, 61]}
        position={[-40, 0, 5]}>
        <meshPhongMaterial color={"green"} />
      </Cylinder>
      <Cylinder name={"led-light-2"}
        castShadow={true}
        receiveShadow={true}
        args={[2, 2, 61]}
        position={[-30, 0, 5]}>
        <meshPhongMaterial color={"blue"} />
      </Cylinder>
    </group>
    <group name={"water-source"}>
      <Cylinder name={"pipe"}
        castShadow={true}
        receiveShadow={true}
        args={[18, 18, 200]}
        position={[0, -legSize / 2 - 20, -50]}
        rotation={[Math.PI / 2, 0, 0]}>
        <meshPhongMaterial color={"#f4f4f4"} />
      </Cylinder>
      <Cylinder name={"faucet-base"}
        castShadow={true}
        receiveShadow={true}
        args={[20, 20, 80]}
        position={[0, -legSize / 2 - 20, 90]}
        rotation={[Math.PI / 2, 0, 0]}>
        <meshPhongMaterial color={"gold"} />
      </Cylinder>
      <Cylinder name={"faucet-outlet"}
        castShadow={true}
        receiveShadow={true}
        args={[18, 18, 70]}
        position={[0, -legSize / 2 - 45, 90]}
        rotation={[Math.PI / 4, 0, 0]}>
        <meshPhongMaterial color={"gold"} />
      </Cylinder>
      <group name={"faucet-handle"}
        position={[0, -legSize / 2 - 65, 105]}
        rotation={[-Math.PI / 4, 0, 0]}>
        <Cylinder name={"handle"}
          castShadow={true}
          receiveShadow={true}
          args={[25, 25, 10]}>
          <meshPhongMaterial color={"#0266b5"} />
        </Cylinder>
        <Cylinder name={"pin"}
          castShadow={true}
          receiveShadow={true}
          args={[4, 4, 15]}>
          <meshPhongMaterial color={"#434343"} />
        </Cylinder>
      </group>
      <Tube name={"garden-hose-curved"}
        castShadow={true}
        receiveShadow={true}
        args={[hosePathCurved, 10, 15, 8]}>
        <meshPhongMaterial color="darkgreen" />
      </Tube>
      <Tube name={"garden-hose-staight"}
        castShadow={true}
        receiveShadow={true}
        args={[hosePathStraight, 1, 15, 8]}>
        <meshPhongMaterial color="darkgreen" />
      </Tube>
    </group>
  </group>
};
