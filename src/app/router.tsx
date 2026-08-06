import { createBrowserRouter } from 'react-router'

import { AppShell } from '../components/layout/AppShell'

import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'

import { TmdbVerificationPage } from '../features/development/pages/TmdbVerificationPage'

import { DiscoverPage } from '../features/discovery/pages/DiscoverPage'
import { HomePage } from '../features/discovery/pages/HomePage'
import { MoviesPage } from '../features/discovery/pages/MoviesPage'
import { TvShowsPage } from '../features/discovery/pages/TvShowsPage'

import { ProfilePage } from '../features/profile/pages/ProfilePage'

import { NotFoundPage } from '../pages/NotFoundPage'

import { MovieDetailPage } from '../features/movie-details/pages/MovieDetailPage'

const developmentRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/tmdb',
        element: <TmdbVerificationPage />,
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'discover',
        element: <DiscoverPage />,
      },
      {
        path: 'movies',
        element: <MoviesPage />,
      },
      {
        path: 'movies/:movieId',
        element: <MovieDetailPage />,
      },
      {
        path: 'tv',
        element: <TvShowsPage />,
      },
      {
        path: 'search',
        lazy: async () => {
          const { SearchPage } = await import(
            '../features/search/pages/SearchPage'
          )

          return {
            Component: SearchPage,
          }
        },
      },
      {
        path: 'library',
        lazy: async () => {
          const { LibraryPage } = await import(
            '../features/library/pages/LibraryPage'
          )

          return {
            Component: LibraryPage,
          }
        },
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      ...developmentRoutes,
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
