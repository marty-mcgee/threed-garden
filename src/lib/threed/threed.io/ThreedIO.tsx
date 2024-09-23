'use client'

import tunnel from 'tunnel-rat'

// export const r3f = tunnel()
// export const tunnelratIO = tunnel()
export const threedIO = tunnel()
// export const threedOI = tunnel()

// import { tunnelratIO } from '#/lib/threed/threedio/threedIO'
// import { threedIO } from '#/lib/threed/threedio/threedIO'

export const ThreedIO = ({ children }: { children: any }) => {
  return <threedIO.In>{children}</threedIO.In>
}

export const ThreedOI = ({ children }: { children: any }) => {
  return <threedIO.Out />
}












