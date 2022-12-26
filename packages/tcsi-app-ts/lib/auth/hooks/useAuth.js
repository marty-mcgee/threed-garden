import { useContext } from 'react'
import { AuthContext } from '#/lib/contexts/AuthContext'

export const useAuth = () => useContext(AuthContext)
