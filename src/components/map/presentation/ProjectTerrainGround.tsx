'use client';

import { useEffect, useMemo } from 'react';
import { TrimeshCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import type { ProjectTerrainSurface } from '@/libraries/services/threed/terrains/terrain-core';

interface Props {
  surface: ProjectTerrainSurface;
  metersPerSceneUnit: number;
  groundSize: number;
  centerX: number;
  centerZ: number;
  onHover?: (position: { x: number; y: number; z: number }) => void;
  onLeave?: () => void;
  onClick?: (position: { x: number; y: number; z: number }) => void;
}

export function buildTerrainGeometry(surface: ProjectTerrainSurface, metersPerSceneUnit: number) {
    const { definition, placement } = surface;
    const vertices = new Float32Array(definition.columns * definition.rows * 3);
    const indices = new Uint32Array((definition.columns - 1) * (definition.rows - 1) * 6);
    const angle = placement.rotationYDeg * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const unit = placement.scale / metersPerSceneUnit;
    for (let row = 0; row < definition.rows; row++) {
      for (let column = 0; column < definition.columns; column++) {
        const i = row * definition.columns + column;
        const x = (column / (definition.columns - 1) - 0.5) * definition.widthM * unit;
        const z = (row / (definition.rows - 1) - 0.5) * definition.lengthM * unit;
        vertices[i * 3] = placement.centerXM / metersPerSceneUnit + cos * x + sin * z;
        vertices[i * 3 + 1] = definition.heightsM[i] * unit;
        vertices[i * 3 + 2] = placement.centerZM / metersPerSceneUnit - sin * x + cos * z;
      }
    }
    let index = 0;
    for (let row = 0; row < definition.rows - 1; row++) {
      for (let column = 0; column < definition.columns - 1; column++) {
        const a = row * definition.columns + column;
        const b = a + 1;
        const c = a + definition.columns;
        const d = c + 1;
        indices.set([a, c, b, b, c, d], index);
        index += 6;
      }
    }
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    mesh.setIndex(new THREE.BufferAttribute(indices, 1));
    mesh.computeVertexNormals();
    return { mesh, vertices, indices };
}

export function ProjectTerrainGround({ surface, metersPerSceneUnit, groundSize, centerX, centerZ, onHover, onLeave, onClick }: Props) {
  const geometry = useMemo(() => buildTerrainGeometry(surface, metersPerSceneUnit), [surface, metersPerSceneUnit]);

  const outside = useMemo(() => {
    const { definition, placement } = surface;
    const angle = placement.rotationYDeg * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const halfX = definition.widthM * placement.scale / (2 * metersPerSceneUnit);
    const halfZ = definition.lengthM * placement.scale / (2 * metersPerSceneUnit);
    const originX = placement.centerXM / metersPerSceneUnit;
    const originZ = placement.centerZM / metersPerSceneUnit;
    const inner = [[-halfX, -halfZ], [halfX, -halfZ], [halfX, halfZ], [-halfX, halfZ]]
      .map(([x, z]) => [originX + cos * x + sin * z, originZ - sin * x + cos * z]);
    const edge = Math.hypot(halfX, halfZ);
    const extent = Math.max(
      groundSize,
      (Math.abs(originX - centerX) + edge) * 2 + 2,
      (Math.abs(originZ - centerZ) + edge) * 2 + 2,
    );
    const outer = [
      [centerX - extent / 2, centerZ - extent / 2],
      [centerX + extent / 2, centerZ - extent / 2],
      [centerX + extent / 2, centerZ + extent / 2],
      [centerX - extent / 2, centerZ + extent / 2],
    ];
    const shape = new THREE.Shape();
    shape.moveTo(outer[0][0], outer[0][1]);
    for (const [x, z] of outer.slice(1)) shape.lineTo(x, z);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(inner[0][0], inner[0][1]);
    for (const [x, z] of inner.slice(1)) hole.lineTo(x, z);
    hole.closePath();
    shape.holes.push(hole);
    const ring = new THREE.ShapeGeometry(shape);
    const positions = ring.getAttribute('position');
    const vertices = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      vertices[i * 3] = positions.getX(i);
      vertices[i * 3 + 2] = positions.getY(i);
    }
    const sourceIndices = ring.getIndex()!.array;
    const indices = new Uint32Array(sourceIndices.length);
    for (let i = 0; i < sourceIndices.length; i += 3) {
      indices[i] = sourceIndices[i];
      indices[i + 1] = sourceIndices[i + 2];
      indices[i + 2] = sourceIndices[i + 1];
    }
    ring.dispose();
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    mesh.setIndex(new THREE.BufferAttribute(indices, 1));
    mesh.computeVertexNormals();
    return { vertices, indices, mesh };
  }, [surface, metersPerSceneUnit, groundSize, centerX, centerZ]);

  useEffect(() => () => geometry.mesh.dispose(), [geometry]);
  useEffect(() => () => outside.mesh.dispose(), [outside]);

  return <>
    <RigidBody type="fixed" colliders={false}>
      <TrimeshCollider args={[outside.vertices, outside.indices]} />
      <TrimeshCollider args={[geometry.vertices, geometry.indices]} />
    </RigidBody>
    <mesh geometry={geometry.mesh} receiveShadow castShadow
      onPointerMove={event => onHover?.({ x: event.point.x, y: event.point.y, z: event.point.z })}
      onPointerLeave={onLeave}
      onClick={event => {
        if (!onClick) return;
        event.stopPropagation();
        onClick({ x: event.point.x, y: event.point.y, z: event.point.z });
      }}>
      <meshStandardMaterial color={surface.definition.appearance.color} roughness={0.92} side={THREE.DoubleSide} />
    </mesh>
    <mesh geometry={outside.mesh} receiveShadow
      onPointerMove={event => onHover?.({ x: event.point.x, y: 0, z: event.point.z })}
      onPointerLeave={onLeave}
      onClick={event => {
        if (!onClick) return;
        event.stopPropagation();
        onClick({ x: event.point.x, y: 0, z: event.point.z });
      }}>
      <meshStandardMaterial color="#527b38" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  </>;
}
