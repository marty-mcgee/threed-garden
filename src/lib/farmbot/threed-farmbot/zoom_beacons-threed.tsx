// @ ts-nocheck /* OR @ ts-expect-error */

import { Sphere, Html, Line } from "@react-three/drei"
import React from "react"
import { Config } from "./config-threed"
import { FOCI, getCameraOffset, setUrlFocusParam } from "./zoom_beacons_constants-threed"
import { useSpring, animated } from "@react-spring/three"

const DEBUG = false
const beaconColor = "#0266b5"
const beaconSize = window.innerWidth > 768 ? 40 : 60

interface ZoomBeaconsProps {
  config: Config
  activeFocus: string
  setActiveFocus(focus: string): void
}

const BeaconPulse = () => {
  const { scale, opacity } = useSpring({
    from: { scale: 1, opacity: 0.75 },
    to: async (next) => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await next({ scale: 2.5, opacity: 0 })
        await new Promise(resolve => setTimeout(resolve, 2000))
        await next({ scale: 1, opacity: 0.75, immediate: true })
      }
    },
    config: { duration: 1500 }
  })

  return (
    // <animated.mesh scale={scale}>
      <Sphere args={[beaconSize, 12, 12]}
        renderOrder={1}>
        {/* <animated.meshPhongMaterial
          color={beaconColor}
          opacity={opacity}
          transparent /> */}
      </Sphere>
    // </animated.mesh>
  )
}

export const ZoomBeacons = (props: ZoomBeaconsProps) => {
  const [hoveredFocus, setHoveredFocus] = React.useState("")
  const { activeFocus, setActiveFocus } = props
  const gardenBedDiv = document.querySelector('.garden-bed-3d-model') as HTMLElement | null

  return <group name={"zoom-beacons"}>
    {FOCI(props.config).map(focus => {
      const camera = getCameraOffset(focus)
      return <group name={"zoom-beacon"} key={focus.label}
        position={focus.position}>
        {DEBUG &&
          <group name={"debug-group"}>
            <Sphere args={[30]} position={camera.position}
              material-color={"cyan"} />
            <Line points={[camera.position, camera.target]}
              color={"yellow"} lineWidth={2} />
            <Sphere args={[30]} position={camera.target}
              material-color={"orange"} />
          </group>}
        <Sphere
          onClick={() => {
            setActiveFocus(activeFocus ? "" : focus.label)
            setUrlFocusParam(focus.label)
            setHoveredFocus("")
            if (gardenBedDiv) {
              gardenBedDiv.style.cursor = ""
            }
          }}
          onPointerEnter={() => {
            setHoveredFocus(focus.label)
            if (gardenBedDiv) {
              gardenBedDiv.style.cursor = activeFocus ? "zoom-out" : "zoom-in"
            }
          }}
          onPointerLeave={() => {
            setHoveredFocus("")
            if (gardenBedDiv) {
              gardenBedDiv.style.cursor = ""
            }
          }}
          receiveShadow={true}
          visible={activeFocus ? false : true}
          args={[beaconSize
            * (hoveredFocus == focus.label ? 1.5 : 1)
            * ((!activeFocus && props.config.sizePreset == "Genesis XL") ? 1.5 : 1),
            12,
            12,
          ]}>
          <meshPhongMaterial color={beaconColor} />
        </Sphere>
        {!activeFocus &&
          <BeaconPulse />}
        {activeFocus == focus.label &&
          <Html name={focus.label}
            wrapperClass="beacon-info-wrapper"
            center
            rotation={[Math.PI / 2, 0, 0]}
            position={focus.info.position}
            distanceFactor={focus.info.scale}>
            <div className="beacon-info"
              onPointerDown={e => e.stopPropagation()}
              onPointerMove={e => e.stopPropagation()}>
              <div className="header">
                <h2>{focus.label}</h2>
                <div className="exit-button"
                  onClick={() => {
                    setActiveFocus("")
                    setUrlFocusParam("")
                  }}>
                  ❌
                </div>
              </div>
              {focus.info.description}
            </div>
          </Html>}
      </group>
    })}
  </group>
}