'use client'

import "./style.css";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "#/lib/ecctrl-new/example/Experience";
import { Leva } from "leva";
import { EcctrlJoystick } from "#/lib/ecctrl-new/src/EcctrlJoystick";
import { Suspense, useEffect, useState } from "react";

// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// const root = ReactDOM.createRoot(document.querySelector("#root"));

const EcctrlJoystickControls = () => {
  const [isTouchScreen, setIsTouchScreen] = useState(false)
  useEffect(() => {
    // Check if using a touch control device, show/hide joystick
    if (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)) {
      setIsTouchScreen(true)
    } else {
      setIsTouchScreen(false)
    }
  }, [])
  return (
    <>
      {isTouchScreen && <EcctrlJoystick buttonNumber={5} />}
    </>
  )
}

// root.render(
const DemoPage: TNextPageWithProps = (): JSX.Element => {
  return (
    <>
      <Leva collapsed />
      <EcctrlJoystickControls />
      <Canvas
        shadows
        camera={{
          fov: 65,
          near: 0.1,
          far: 1000,
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') {
            (e.target as HTMLCanvasElement).requestPointerLock()
          }
        }}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
    </>
  );
}

export default DemoPage