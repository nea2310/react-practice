// features/uiSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  isNotificationsPageOpen: boolean
}

const initialState: UiState = {
  isNotificationsPageOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setNotificationsPageOpen(state, action: PayloadAction<boolean>) {
      state.isNotificationsPageOpen = action.payload
    },
  },
})

export const { setNotificationsPageOpen } = uiSlice.actions
export default uiSlice.reducer
