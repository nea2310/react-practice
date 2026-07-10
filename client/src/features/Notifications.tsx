// features/Notifications.tsx
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { List, type RowComponentProps } from 'react-window'
import { useGetNotificationsQuery } from '../api/apiSlice'
import {
  allNotificationsRead,
  markNotificationsOld,
  selectMetadataEntities,
} from './notificationsSlice'
import { setNotificationsPageOpen } from './uiSlice'
import { useAppDispatch, useAppSelector } from '../app/hooks'

type NotificationItemData = {
  id: string
  text: string
  isNew: boolean
}

// Компонент строки (ожидает пропы: index, style, names)
const Row = ({
               index,
               names,
               style,
             }: RowComponentProps<{
  names: NotificationItemData[]
}>) => {
  const item = names[index]
  return (
    <div style={{ ...style, borderBottom: '1px solid #eee' }}>
      <div
        style={{
          backgroundColor: item.isNew ? 'yellow' : 'transparent',
          transition: 'background-color 1s ease 1s',
          // padding: '8px',
        }}
      >
        {item.text}
      </div>
    </div>
  )
}

const Notifications = () => {
  const dispatch = useAppDispatch()
  const { data: notifications = [] } = useGetNotificationsQuery()
  const metadataEntities = useAppSelector(selectMetadataEntities)

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

  const itemsData: NotificationItemData[] = useMemo(
    () =>
      notifications.map((item) => ({
        id: item.id,
        text: item.text,
        isNew: metadataEntities[item.id]?.isNew ?? false,
      })),
    [notifications, metadataEntities]
  )

  const onItemsRendered = useCallback(
    ({ startIndex, stopIndex }: { startIndex: number; stopIndex: number }) => {
      for (let i = startIndex; i <= stopIndex; i++) {
        const item = itemsData[i]
        if (!item) continue
        const { id, isNew } = item
        if (!isNew) continue
        if (seenIds.current.has(id)) continue

        seenIds.current.add(id)
        dispatch(markNotificationsOld([id]))
      }
    },
    [dispatch, itemsData]
  )

    const ITEM_HEIGHT = 25

  return (
    <div style={{ padding: '20px' }}>
      <h1>Уведомления</h1>
      {notifications.length === 0 ? (
        <p>Нет уведомлений</p>
      ) : (
        <List
            className={'list'}
              rowCount={itemsData.length}
          rowHeight={ITEM_HEIGHT}
          rowComponent={Row}
          rowProps={{ names: itemsData }}
          onRowsRendered={onItemsRendered}
         />
      )}
    </div>
  )
}

export default Notifications