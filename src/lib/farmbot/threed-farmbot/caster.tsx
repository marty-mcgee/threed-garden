import { Extrude, Cylinder } from "@react-three/drei";
import { Shape } from "three";
import { Config } from "./config";

interface CasterProps {
  config: Config;
}

export const Caster = (props: CasterProps) => {
  const {
    bedHeight, bedZOffset, legSize, legsFlush,
  } = props.config;
  const casterHeight = legSize * 1.375;
  const casterBracket2D = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(legSize, 0);
    shape.lineTo(legSize / 3 * 2, -legSize);
    shape.lineTo(legSize / 3, -legSize);
    shape.lineTo(0, 0);
    return shape;
  }
  return <group name={"caster"}
  position={[
    -legSize / 2,
    legSize / 2,
    (-bedZOffset - (legsFlush ? bedHeight : 0) + casterHeight) / 2
  ]}
  rotation={[Math.PI / 2, 0, 0]}>
  <Extrude name={"caster-bracket"}
    castShadow={true}
    receiveShadow={true}
    args={[
      casterBracket2D(),
      { steps: 1, depth: legSize, bevelEnabled: false },
    ]}>
    <meshPhongMaterial color={"silver"} />
  </Extrude>
  <group name={"caster-wheel"}
    position={[legSize / 2, -legSize * 0.75, legSize / 2]}
    rotation={[Math.PI / 2, 0, 0]}>
    <Cylinder name={"wheel"}
      castShadow={true}
      receiveShadow={true}
      args={[legSize * 0.625, legSize * 0.625, legSize / 3]}>
      <meshPhongMaterial color={"#434343"} />
    </Cylinder>
    <Cylinder name={"axle"}
      castShadow={true}
      receiveShadow={true}
      args={[legSize / 10, legSize / 10, legSize * 1.1]}>
      <meshPhongMaterial color={"#434343"} />
    </Cylinder>
  </group>
</group>
};
