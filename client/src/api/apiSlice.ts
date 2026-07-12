// features/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ServerNotification } from '../types'
import { notificationsReceived, markNotificationsRead } from '../features/notificationsSlice'
import type { RootState } from '../app/store.ts'
import type { User } from '../features/authSlice.ts'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    register: builder.mutation<{ user: User; token: string }, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    login: builder.mutation<{ user: User; token: string }, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
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
        const state = lifecycleApi.getState() as RootState
        const token = state.auth.token
        const ws = new WebSocket(`ws://localhost:5000?token=${token}`)
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

export const { useGetNotificationsQuery, useLoginMutation, useRegisterMutation } = apiSlice
