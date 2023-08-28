// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers
import chat from '#/lib/stores/redux/modules/chat'
import user from '#/lib/stores/redux/modules/user'
import email from '#/lib/stores/redux/modules/email'
import invoice from '#/lib/stores/redux/modules/invoice'
import calendar from '#/lib/stores/redux/modules/calendar'
import permissions from '#/lib/stores/redux/modules/permissions'

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
