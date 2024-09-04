'use client'

// import { tunnelratIO } from '#/lib/threed/threedio/threedIO'
import { threedIO } from '#/lib/threed/threedio/threedIO'

export const ThreedIO = ({ children }) => {
  return <threedIO.In>{children}</threedIO.In>
}
