// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers
import chat from '#/lib/stores/redux/apps/chat'
import user from '#/lib/stores/redux/apps/user'
import email from '#/lib/stores/redux/apps/email'
import invoice from '#/lib/stores/redux/apps/invoice'
import calendar from '#/lib/stores/redux/apps/calendar'
import permissions from '#/lib/stores/redux/apps/permissions'

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
