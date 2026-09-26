'use client';

import { useEffect, useMemo } from 'react'
import { useFBX, useAnimations } from '@react-three/drei'

export enum AnimationType {
  Idle = 'idle',
  Walk = 'walk',
  Run = 'run',
  Jump = 'jump',
  Turn = 'turn',
}

export function FarmerAnimationTest() {
  const farmer = useFBX(
    '/assets/characters/SK_Chr_Farmer_Female_01.fbx'
  )

  const idleFBX = useFBX('/assets/animations/Idle.fbx')
  const walkFBX = useFBX('/assets/animations/Walking.fbx')
  const runFBX = useFBX('/assets/animations/Running.fbx')

  const clips = useMemo(() => {
    const idle = idleFBX.animations[0]?.clone()
    const walk = walkFBX.animations[0]?.clone()
    const run = runFBX.animations[0]?.clone()

    if (idle) idle.name = AnimationType.Idle
    if (walk) walk.name = AnimationType.Walk
    if (run) run.name = AnimationType.Run

    return [idle, walk, run].filter(Boolean)
  }, [idleFBX, walkFBX, runFBX])

  const { actions, names } = useAnimations(clips, farmer)

  useEffect(() => {
    console.log('Animation names:', names)

    clips.forEach((clip) => {
      if (!clip) return

      console.log({
        name: clip.name,
        duration: clip.duration,
        tracks: clip.tracks.length,
      })
    })
  }, [clips, names])

  useEffect(() => {
    actions[AnimationType.Idle]?.reset().play()

    return () => {
      actions[AnimationType.Idle]?.stop()
    }
  }, [actions])

  return <primitive object={farmer} scale={0.01} />
}