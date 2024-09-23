// import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, GroupProps, MeshProps, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { ColorRepresentation, Mesh } from "three";
// import "./styles.css";
import tunnel from "./tunnelrat";

const t = tunnel();

const DOM = () => (
  <div className="panel">
    <p>Click the meshes to toggle them.</p>
    <p>Currently Active:</p>
    <ul>
      <t.Out />
    </ul>
  </div>
);

type ThingyProps = {
  speed?: number;
  color?: ColorRepresentation;
  name: string;
} & MeshProps;

const Thingy = ({
  name,
  speed = 0,
  color = "white",
  ...props
}: ThingyProps) => {
  const mesh = useRef<Mesh>(null!);
  const [wireframe, setWireframe] = useState(false);

  useFrame((_, dt) => {
    mesh.current.rotation.x = mesh.current.rotation.y += dt * speed;
  });

  return (
    <>
      {!wireframe && (
        <t.In>
          <li>{name}</li>
        </t.In>
      )}

      <mesh ref={mesh} {...props} onClick={() => setWireframe(!wireframe)}>
        <dodecahedronGeometry />
        <meshStandardMaterial
          color={color}
          wireframe={wireframe}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
    </>
  );
};

const Three = () => (
  <Canvas>
    {/* <Environment preset="sunset" /> */}
    <Thingy name="One" position={[-3, 0, 0]} speed={0.5} color="#ffafcc" />
    <Thingy name="Two" position={[0, 0, 0]} speed={-0.3} color="#e9edc9" />
    <Thingy name="Three" position={[3, 0, 0]} speed={0.2} color="#ffb703" />
  </Canvas>
);

export default function App() {
  return (
    <>
      <DOM />
      <Three />
    </>
  );
}
