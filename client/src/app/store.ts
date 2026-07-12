import { configureStore } from '@reduxjs/toolkit'

import notificationsReducer from '../features/notificationsSlice'
import uiReducer from '../features/uiSlice'
import { apiSlice } from '../api/apiSlice.ts'
import authReducer from '../features/authSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    notifications: notificationsReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
