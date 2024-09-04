'use client'

// import { tunnelratAI } from '#/lib/threed/threedio/threedAI'
import { threedAI } from '#/lib/threed/threedio/threedAI'

export const ThreedAI = ({ children }) => {
  return <threedAI.In>{children}</threedAI.In>
}
