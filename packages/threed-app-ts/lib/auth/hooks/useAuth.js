import { useContext } from 'react'
import { AuthContext } from '#/ui/context/AuthContext'

export const useAuth = () => useContext(AuthContext)
