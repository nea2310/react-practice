// features/Login.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLoginMutation } from '../api/apiSlice'
import { setCredentials } from './authSlice'
import { useAppDispatch } from '../app/hooks'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [login, { isLoading, error }] = useLoginMutation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await login({ username, password }).unwrap()
      dispatch(setCredentials(result))
      navigate('/')
    } catch (err) {
      // ошибка уже в error
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>Ошибка входа</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Войти'}
        </button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  )
}

export default Login
