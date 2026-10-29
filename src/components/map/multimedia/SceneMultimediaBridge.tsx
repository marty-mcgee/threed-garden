'use client';

import { useEffect } from 'react';
import type { MultimediaScene } from '@/libraries/services/threed/multimedia/scene-multimedia-player';
import type { ThreeDPhysicsEventV1 } from '@/libraries/services/threed/physics/physics-event-core';
import { useSceneMultimedia } from './SceneMultimediaProvider';

export function SceneMultimediaBridge({ context, subscribe }: {
  context: MultimediaScene;
  subscribe: (listener: (event: Readonly<ThreeDPhysicsEventV1>) => void) => () => void;
}) {
  const multimedia = useSceneMultimedia();
  const setScene = multimedia?.setScene;
  const player = multimedia?.player;
  useEffect(() => {
    if (!setScene) return;
    setScene(context);
    return () => setScene(null);
  }, [context, setScene]);
  useEffect(() => player ? subscribe(event => player.observe(event)) : undefined, [player, subscribe]);
  return null;
}
