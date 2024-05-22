// @ts-nocheck /* OR @ ts-expect-error */

import { Shape } from "three";
import { Extrude, Text, Line } from "@react-three/drei";
import { ASSETS } from "./constants";
import { threeSpace } from "./helpers";
import { Config } from "./config";

interface SolarProps {
  config: Config;
}

const panelWidth = 540;
const panelLength = 1040;

const cell2D = () => {
  const cellSize = 95;
  const cellBevel = 15;
  const path = new Shape();
  path.moveTo(cellBevel, 0);
  path.lineTo(cellSize - cellBevel, 0);
  path.lineTo(cellSize, cellBevel);
  path.lineTo(cellSize, cellSize - cellBevel);
  path.lineTo(cellSize - cellBevel, cellSize);
  path.lineTo(cellBevel, cellSize);
  path.lineTo(0, cellSize - cellBevel);
  path.lineTo(0, cellBevel);
  return path;
};

const cellArray = () => {
  const cells = [];
  const cellSize = 100;
  const cellsWide = Math.floor(panelWidth / cellSize);
  const cellsLong = Math.floor(panelLength / cellSize);

  for (let x = 0; x < cellsWide; x++) {
    for (let y = 0; y < cellsLong; y++) {
      const xPos = x * cellSize - (panelWidth / 2) + 20 + 2.5;
      const yPos = y * cellSize - (panelLength / 2) + 20 + 2.5;
      cells.push(
        <mesh key={`${x}-${y}`} position={[xPos, yPos, 15]}>
          <Extrude args={[cell2D(), { steps: 1, depth: 2, bevelEnabled: false }]}>
            <meshPhongMaterial color={"#131361"} />
          </Extrude>
        </mesh>
      );
    }
  }
  return cells;
};

const SolarPanel = () => {
  return (
    <group rotation={[0, Math.PI / 6, 0]}>
      <mesh>
        <boxGeometry args={[panelWidth, panelLength, 30]} />
        <meshPhongMaterial color={"silver"} />
      </mesh>
      {cellArray()}
    </group>
  );
};

export const Solar = (props: SolarProps) => {
  const { config } = props;
  const zGround = -config.bedZOffset - config.bedHeight;
  return (
    <group name={"solar"}
      visible={config.solar}>
      <group name={"solar-array"}
        position={[
          threeSpace(-2000, config.bedLengthOuter),
          threeSpace(-1500, config.bedWidthOuter),
          zGround + 200,
        ]}>
        <group position={[0, -525, 0]}>
          <SolarPanel />
        </group>
        <group position={[0, 525, 0]}>
          <SolarPanel />
        </group>
        <Text name={"solar-disclaimer"}
          fontSize={60}
          font={ASSETS.fonts.inknut}
          color={"white"}
          outlineColor={"black"}
          outlineWidth={0}
          outlineBlur={20}
          outlineOpacity={0.75}
          position={[-200, 0, 200]}
          rotation={[0, Math.PI / 3, Math.PI / 2]}>
          Solar array not included
        </Text>
      </group>
      <Line name={"solar-wiring"}
        points={[
          [
            threeSpace(config.bedLengthOuter + 587.5 - config.legSize / 2, config.bedLengthOuter),
            threeSpace(config.legSize / 2, config.bedWidthOuter),
            zGround + 20,
          ],
          [
            threeSpace(config.bedLengthOuter + 600, config.bedLengthOuter),
            threeSpace(-1500, config.bedWidthOuter),
            zGround + 20,
          ],
          [
            threeSpace(-2000, config.bedLengthOuter),
            threeSpace(-1500, config.bedWidthOuter),
            zGround + 20,
          ]]}
        color={"yellow"}
        lineWidth={5} />
    </group>
  );
};
