// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers
import chat from '~/stores/redux/apps/chat'
import user from '~/stores/redux/apps/user'
import email from '~/stores/redux/apps/email'
import invoice from '~/stores/redux/apps/invoice'
import calendar from '~/stores/redux/apps/calendar'
import permissions from '~/stores/redux/apps/permissions'

export const store = configureStore({
  reducer: {
    user,
    chat,
    email,
    invoice,
    calendar,
    permissions,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
