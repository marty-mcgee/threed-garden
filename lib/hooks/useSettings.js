import { useContext } from 'react'
import { SettingsContext } from '#/lib/contexts/SettingsContext'

export const useSettings = () => useContext(SettingsContext)
