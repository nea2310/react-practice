// features/notificationsSlice.ts
import { createEntityAdapter, createSlice, createAction, type PayloadAction } from '@reduxjs/toolkit'
import type { ServerNotification } from '../types'

export const notificationsReceived = createAction<ServerNotification[]>('notifications/notificationsReceived')

export interface NotificationMetadata {
  id: string
  read: boolean
  isNew: boolean
}

const metadataAdapter = createEntityAdapter<NotificationMetadata>()
const initialState = metadataAdapter.getInitialState()

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    allNotificationsRead(state) {
      Object.values(state.entities).forEach((metadata) => {
        metadata.read = true
      })
    },
    clearIsNewForAll(state) {
      Object.values(state.entities).forEach((metadata) => {
        if (metadata.read) {
          metadata.isNew = false
        }
      })
    },
    markNotificationsRead(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        const meta = state.entities[id]
        if (meta) meta.read = true
      })
    },
    markNotificationsOld(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        const meta = state.entities[id]
        if (meta) meta.isNew = false
      })
    },
    markNotificationsNew(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        const meta = state.entities[id]
        if (meta) {
          meta.isNew = true
        }
      })
    },
  },
  extraReducers: (builder) => {
    builder.addCase(notificationsReceived, (state, action) => {
      const notifications = action.payload
      const newMetadata: NotificationMetadata[] = notifications
        .filter((n) => !state.entities[n.id])
        .map((n) => ({
          id: n.id,
          read: false,
          isNew: true,
        }))

      Object.values(state.entities).forEach((metadata) => {
        metadata.isNew = !metadata.read
      })

      metadataAdapter.upsertMany(state, newMetadata)
    })
  },
})

export const {
  allNotificationsRead,
  clearIsNewForAll,
  markNotificationsRead,
  markNotificationsOld,
  markNotificationsNew,
} = notificationsSlice.actions

export default notificationsSlice.reducer

// Селекторы без зависимости от RootState
export const { selectAll: selectAllNotificationsMetadata, selectEntities: selectMetadataEntities } =
  metadataAdapter.getSelectors((state: any) => state.notifications)

export const selectUnreadCount = (state: any) => {
  const allMetadata = selectAllNotificationsMetadata(state)
  return allMetadata.filter((meta) => !meta.read).length
}
