// features/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ServerNotification } from '../types'
import {
  notificationsReceived,
  markNotificationsRead,
} from '../features/notificationsSlice'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<ServerNotification[], void>({
      query: () => '/initial-data',
      transformResponse: (response: { items: ServerNotification[]; lastUpdate: number }) => response.items,

      // Обработка начальной загрузки
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(notificationsReceived(data))
        } catch {
          // Игнорируем ошибки
        }
      },

      // WebSocket-подписка
      async onCacheEntryAdded(_arg, lifecycleApi) {
        const ws = new WebSocket('ws://localhost:5000')
        try {
          await lifecycleApi.cacheDataLoaded
          const listener = (event: MessageEvent<string>) => {
            const message = JSON.parse(event.data)
            switch (message.type) {
              case 'update': {
                const newNotifications = message.payload as ServerNotification[]

                // 1. Обновляем кэш RTK Query
                lifecycleApi.updateCachedData((draft) => {
                  draft.unshift(...newNotifications)
                })

                // 2. Диспатчим action для создания метаданных (добавляем только новые)
                lifecycleApi.dispatch(notificationsReceived(newNotifications))

                // 3. Если вкладка открыта – сразу помечаем новые как прочитанные
                const state = lifecycleApi.getState() as any
                const isOpen = state.ui?.isNotificationsPageOpen ?? false
                const newIds = newNotifications.map((n) => n.id)

                if (isOpen) {
                  lifecycleApi.dispatch(markNotificationsRead(newIds))
                  // Выделение (isNew) останется true до момента, пока элемент не попадёт в зону видимости
                  // и не будет обработан IntersectionObserver в компоненте
                }
                // Если вкладка закрыта – оставляем read: false, isNew: true (накапливаются в бейдже)
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
          // Игнорируем ошибки (например, если запись удалена до загрузки данных)
        }
        await lifecycleApi.cacheEntryRemoved
        ws.close()
      },
      providesTags: ['Notifications'],
    }),
  }),
})

export const { useGetNotificationsQuery } = apiSlice