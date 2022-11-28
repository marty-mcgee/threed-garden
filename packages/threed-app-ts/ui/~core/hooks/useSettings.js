import { useContext } from 'react'
import { SettingsContext } from '~/ui/~core/context/settingsContext'

export const useSettings = () => useContext(SettingsContext)
