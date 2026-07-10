// features/Notifications.tsx
import { useEffect, useRef } from 'react'
import { useGetNotificationsQuery } from '../api/apiSlice'
import {
  allNotificationsRead,
  markNotificationsOld,
  selectMetadataEntities,
} from './notificationsSlice'
import { setNotificationsPageOpen } from './uiSlice'
import { useAppDispatch, useAppSelector } from '../app/hooks'

const Notifications = () => {
  const dispatch = useAppDispatch()
  const { data: notifications = [] } = useGetNotificationsQuery()
  const metadataEntities = useAppSelector(selectMetadataEntities)
  const containerRef = useRef<HTMLUListElement>(null)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    dispatch(setNotificationsPageOpen(true))
    return () => {
      dispatch(setNotificationsPageOpen(false))
    }
  }, [dispatch])

  useEffect(() => {
    if (notifications.length > 0) {
      dispatch(allNotificationsRead())
    }
  }, [dispatch, notifications])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('data-id')
              if (!id || seenIds.current.has(id)) return

              const metadata = metadataEntities[id]
              if (metadata?.isNew) {
                seenIds.current.add(id)
                dispatch(markNotificationsOld([id]))
              }
            }
          })
        },
        { threshold: 0.5 }
    )

    const children = container.children
    Array.from(children).forEach((child) => observer.observe(child))

    return () => observer.disconnect()
  }, [notifications, dispatch, metadataEntities])

  return (
      <div style={{ padding: '20px' }}>
        <h1>Уведомления</h1>
        <ul ref={containerRef}>
          {notifications.map((item) => {
            const metadata = metadataEntities[item.id]
            const isNew = metadata?.isNew ?? false
            return (
                <li
                    key={item.id}
                    data-id={item.id}
                    style={{
                      backgroundColor: isNew ? 'yellow' : 'transparent',
                      transition: 'background-color 1s ease 1s',
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