'use client'

// import { tunnelratIO } from '@/lib/threed/helpers/threedIO'
import { threedIO } from '@/lib/threed/helpers/threedIO'

export const ThreedIO = ({ children }) => {
  return <threedIO.In>{children}</threedIO.In>
}
