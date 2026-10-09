'use client';
import { useLayoutEffect, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Group } from 'three';
import { DesignGeometryCache } from '@/libraries/services/threed/design/geometry';
import type { DesignDocument } from '@/libraries/services/threed/design/document';

/** Mount inside the existing Scene Canvas. Only this owner's generated resources are changed. */
export function DesignSceneObjects({ document, projectId, metersPerSceneUnit, selected = null, onSelect, visibleLevelId, showRoofs = true }: {
  document: DesignDocument; projectId: number; metersPerSceneUnit: number;
  selected?: string | null; onSelect?: (id: string) => void; visibleLevelId?: string; showRoofs?: boolean;
}) {
  const host = useRef<Group>(null), cache = useRef<DesignGeometryCache | null>(null);
  useLayoutEffect(() => {
    const owner = new DesignGeometryCache(), parent = host.current!;
    cache.current = owner; parent.add(owner.group);
    return () => { parent.remove(owner.group); owner.dispose(); cache.current = null; };
  }, [projectId]);
  useLayoutEffect(() => {
    const owner = cache.current; if (!owner) return;
    owner.update(document, selected, visibleLevelId, showRoofs);
    owner.group.traverse(object => {
      if (typeof object.userData.designEntityId === 'string') {
        object.userData.projectId = projectId;
        object.userData.sceneObjectId = `project:${projectId}:architecture:${object.userData.designEntityId}`;
      }
    });
  }, [document, selected, visibleLevelId, showRoofs, projectId]);
  const select = (event: ThreeEvent<MouseEvent>) => {
    const id = event.object.userData.designEntityId;
    if (typeof id === 'string') { event.stopPropagation(); onSelect?.(id); }
  };
  return <group ref={host} name={`project:${projectId}:architecture`} scale={1 / metersPerSceneUnit} onClick={select} />;
}
