import { Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'

/** При открытии приложения: если пользователь уже в базе — в личный кабинет, иначе на регистрацию. */
export function HomeRedirect() {
  const { user } = useUser()
  return <Navigate to={user ? '/profile' : '/auth'} replace />
}
