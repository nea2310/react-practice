// features/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ServerNotification } from '../types'
import { notificationsReceived, markNotificationsRead, markNotificationsOld } from '../features/notificationsSlice'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<ServerNotification[], void>({
      query: () => '/initial-data',
      transformResponse: (response: { items: ServerNotification[]; lastUpdate: number }) => response.items,

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(notificationsReceived(data))
        } catch {
          // Игнорируем ошибки
        }
      },

      async onCacheEntryAdded(_arg, lifecycleApi) {
        const ws = new WebSocket('ws://localhost:5000')
        try {
          await lifecycleApi.cacheDataLoaded
          const listener = (event: MessageEvent<string>) => {
            const message = JSON.parse(event.data)
            switch (message.type) {
              case 'update': {
                const newNotifications = message.payload as ServerNotification[]
                lifecycleApi.updateCachedData((draft) => {
                  draft.unshift(...newNotifications)
                })
                lifecycleApi.dispatch(notificationsReceived(newNotifications))

                const state = lifecycleApi.getState() as any
                const isOpen = state.ui?.isNotificationsPageOpen ?? false
                const newIds = newNotifications.map((n) => n.id)

                if (isOpen) {
                  lifecycleApi.dispatch(markNotificationsRead(newIds))
                  setTimeout(() => {
                    lifecycleApi.dispatch(markNotificationsOld(newIds))
                  }, 5000)
                }
                break
              }
              default:
                break
            }
          }
          ws.addEventListener('message', listener)
          ws.onerror = (error) => console.error('WebSocket error:', error)
          ws.onclose = () => console.log('WebSocket closed')
        } catch {
          // Игнорируем ошибки
        }
        await lifecycleApi.cacheEntryRemoved
        ws.close()
      },
      providesTags: ['Notifications'],
    }),
  }),
})

export const { useGetNotificationsQuery } = apiSlice
