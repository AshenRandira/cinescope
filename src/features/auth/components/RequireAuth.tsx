import type { ReactNode } from 'react'
import {
  Navigate,
  useLocation,
} from 'react-router'

import { LoadingState } from '../../../components/feedback'
import { useAuth } from '../hooks/useAuth'

import './RequireAuth.css'

export function RequireAuth({
  children,
}: {
  children: ReactNode
}) {
  const location = useLocation()
  const { status } = useAuth()

  if (status === 'initializing') {
    return (
      <section className="auth-route-state">
        <LoadingState
          title="Restoring your archive session"
          message="CineScope is checking the locally persisted Firebase session."
        />
      </section>
    )
  }

  if (status !== 'authenticated') {
    return (
      <Navigate
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
        to="/login"
      />
    )
  }

  return children
}
