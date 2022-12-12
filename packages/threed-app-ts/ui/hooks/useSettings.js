import { useContext } from 'react'
import { SettingsContext } from '#/ui/context/settingsContext'

export const useSettings = () => useContext(SettingsContext)
