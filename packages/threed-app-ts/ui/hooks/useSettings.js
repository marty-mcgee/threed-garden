import { useContext } from 'react'
import { SettingsContext } from '#/lib/contexts/settingsContext'

export const useSettings = () => useContext(SettingsContext)
