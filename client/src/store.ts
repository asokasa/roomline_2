import { configureStore, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { loadStoredAuth } from './api'
import type { AuthState } from './types'

export type Theme = 'dark' | 'light'

type SessionState = AuthState & {
  theme: Theme
}

const storedAuth = loadStoredAuth()

const initialState: SessionState = {
  ...storedAuth,
  theme: localStorage.getItem('roomlie-theme') === 'light' ? 'light' : 'dark',
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setAuthState(state, action: PayloadAction<AuthState>) {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    clearAuthState(state) {
      state.token = null
      state.user = null
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
  },
})

export const { clearAuthState, setAuthState, setTheme } = sessionSlice.actions

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
