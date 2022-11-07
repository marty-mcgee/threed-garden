import { useContext } from 'react'
import { SettingsContext } from '~/@core/context/settingsContext'

export const useSettings = () => useContext(SettingsContext)
