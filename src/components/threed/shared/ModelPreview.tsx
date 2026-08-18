// src/components/threed/ModelPreview.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense } from 'react';

interface ModelViewerProps {
  url: string;
  scale?: number;
}

interface ModelPreviewProps {
  modelUrl: string;
  scale?: number;
}

function ModelViewer({ url, scale = 1 }: ModelViewerProps) {
  const { scene } = useGLTF<string>(url);
  return <primitive object={scene} scale={scale} />;
}

export function ModelPreview({ modelUrl, scale = 1 }: ModelPreviewProps) {
  return (
    <div className="h-64 w-full rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-gray-700">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        <Suspense fallback={null}>
          <ModelViewer url={modelUrl} scale={scale} />
          <OrbitControls enableZoom={true} enablePan={true} />
          <Environment preset="park" />
        </Suspense>
      </Canvas>
    </div>
  );
}
