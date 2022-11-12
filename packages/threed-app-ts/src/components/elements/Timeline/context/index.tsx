/**
  This file is used for controlling the dark and light state of the TimelineList and TimelineItem.
*/

import { createContext, useContext, ReactNode } from 'react'

// The Timeline main context
const Timeline = createContext<JSX.Element | boolean | null>(null)

// Declaring props types for TimelineProvider
interface Props {
  children: ReactNode
  value: boolean
}

// Timeline context provider
function TimelineProvider({ children, value }: Props): JSX.Element {
  return <Timeline.Provider value={value}>{children}</Timeline.Provider>
}

// Timeline custom hook for using context
function useTimeline() {
  return useContext(Timeline)
}

export { TimelineProvider, useTimeline }
