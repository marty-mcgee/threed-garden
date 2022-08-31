// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers
import chat from '~/store/apps/chat'
import user from '~/store/apps/user'
import email from '~/store/apps/email'
import invoice from '~/store/apps/invoice'
import calendar from '~/store/apps/calendar'
import permissions from '~/store/apps/permissions'

const store = configureStore({
  reducer: {
    user,
    chat,
    email,
    invoice,
    calendar,
    permissions
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export default store
