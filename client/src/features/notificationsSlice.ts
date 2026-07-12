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
    // (другие редьюсеры, если есть)
  },
  extraReducers: (builder) => {
    builder.addCase(notificationsReceived, (state, action) => {
      const notifications = action.payload
      const newMetadata: NotificationMetadata[] = notifications
        .filter((n) => !state.entities[n.id]) // только новые
        .map((n) => ({
          id: n.id,
          read: false,
          isNew: true,
        }))

      // Добавляем только новые записи, не трогая существующие
      metadataAdapter.upsertMany(state, newMetadata)
    })
  },
})

export const { allNotificationsRead, markNotificationsRead, markNotificationsOld } = notificationsSlice.actions

export default notificationsSlice.reducer

export const { selectAll: selectAllNotificationsMetadata, selectEntities: selectMetadataEntities } =
  metadataAdapter.getSelectors((state: any) => state.notifications)

export const selectUnreadCount = (state: any) => {
  const allMetadata = selectAllNotificationsMetadata(state)
  return allMetadata.filter((meta) => !meta.read).length
}
