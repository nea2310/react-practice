// features/Notifications.tsx
import { useEffect } from 'react'
import { useGetNotificationsQuery } from '../api/apiSlice'
import {
  allNotificationsRead,
  clearIsNewForAll,
  markNotificationsNew,
  selectMetadataEntities,
} from './notificationsSlice'
import { setNotificationsPageOpen } from './uiSlice'
import { useAppDispatch, useAppSelector } from '../app/hooks'

const Notifications = () => {
  const dispatch = useAppDispatch()
  const { data: notifications = [] } = useGetNotificationsQuery()
  const metadataEntities = useAppSelector(selectMetadataEntities)

  // Устанавливаем флаг открытой вкладки
  useEffect(() => {
    dispatch(setNotificationsPageOpen(true))
    return () => {
      dispatch(setNotificationsPageOpen(false))
    }
  }, [dispatch])

  // Логика при загрузке/обновлении данных
  useEffect(() => {
    if (notifications.length > 0) {
      // 1. Собираем ID непрочитанных до того, как пометим их прочитанными
      const unreadIds = Object.values(metadataEntities)
        .filter((meta) => !meta.read)
        .map((meta) => meta.id)

      // 2. Помечаем все как прочитанные (счётчик обнуляется)
      dispatch(allNotificationsRead())

      // 3. Помечаем те, что были непрочитанными, как новые (isNew = true) – они станут жёлтыми
      if (unreadIds.length > 0) {
        dispatch(markNotificationsNew(unreadIds))
      }

      // 4. Через 5 секунд снимаем выделение со всех, у кого read === true
      const timer = setTimeout(() => {
        dispatch(clearIsNewForAll())
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [dispatch, notifications, metadataEntities]) // добавили metadataEntities в зависимости

  return (
    <div style={{ padding: '20px' }}>
      <h1>Уведомления</h1>
      <ul>
        {notifications.map((item) => {
          const metadata = metadataEntities[item.id]
          const isNew = metadata?.isNew ?? false
          return (
            <li
              key={item.id}
              style={{
                backgroundColor: isNew ? 'yellow' : 'transparent',
                transition: 'background-color 0.5s ease',
              }}
            >
              {item.text}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Notifications
