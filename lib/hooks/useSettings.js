import { useContext } from 'react'
import { SettingsContext } from '#/lib/contexts/settings/SettingsContext'

export const useSettings = () => useContext(SettingsContext)
