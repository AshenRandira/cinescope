import { createBrowserRouter } from 'react-router'

import { RouteErrorBoundary } from '../components/feedback/RouteErrorBoundary'
import { AppShell } from '../components/layout/AppShell'
import { HomePage } from '../features/discovery/pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

const developmentRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/tmdb',
        lazy: async () => {
          const { TmdbVerificationPage } = await import(
            '../features/development/pages/TmdbVerificationPage'
          )

          return {
            Component: TmdbVerificationPage,
          }
        },
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'discover',
        lazy: async () => {
          const { DiscoverPage } = await import(
            '../features/discovery/pages/DiscoverPage'
          )

          return {
            Component: DiscoverPage,
          }
        },
      },
      {
        path: 'movies',
        lazy: async () => {
          const { MoviesPage } = await import(
            '../features/discovery/pages/MoviesPage'
          )

          return {
            Component: MoviesPage,
          }
        },
      },
      {
        path: 'movies/:movieId',
        lazy: async () => {
          const { MovieDetailPage } = await import(
            '../features/movie-details/pages/MovieDetailPage'
          )

          return {
            Component: MovieDetailPage,
          }
        },
      },
      {
        path: 'tv',
        lazy: async () => {
          const { TvShowsPage } = await import(
            '../features/discovery/pages/TvShowsPage'
          )

          return {
            Component: TvShowsPage,
          }
        },
      },
      {
        path: 'tv/:tvId',
        lazy: async () => {
          const { TvDetailPage } = await import(
            '../features/tv-details/pages/TvDetailPage'
          )

          return {
            Component: TvDetailPage,
          }
        },
      },
      {
        path: 'tv/:tvId/season/:seasonNumber',
        lazy: async () => {
          const { TvSeasonPage } = await import(
            '../features/tv-seasons/pages/TvSeasonPage'
          )

          return {
            Component: TvSeasonPage,
          }
        },
      },
      {
        path: 'tv/:tvId/season/:seasonNumber/episode/:episodeNumber',
        lazy: async () => {
          const { TvEpisodePage } = await import(
            '../features/tv-episodes/pages/TvEpisodePage'
          )

          return {
            Component: TvEpisodePage,
          }
        },
      },
      {
        path: 'people/:personId',
        lazy: async () => {
          const { PersonDetailPage } = await import(
            '../features/person-details/pages/PersonDetailPage'
          )

          return {
            Component: PersonDetailPage,
          }
        },
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
        lazy: async () => {
          const [{ RequireAuth }, { ProfilePage }] =
            await Promise.all([
              import(
                '../features/auth/components/RequireAuth'
              ),
              import(
                '../features/profile/pages/ProfilePage'
              ),
            ])

          return {
            Component: function ProtectedProfileRoute() {
              return (
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              )
            },
          }
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { LoginPage } = await import(
            '../features/auth/pages/LoginPage'
          )

          return {
            Component: LoginPage,
          }
        },
      },
      {
        path: 'register',
        lazy: async () => {
          const { RegisterPage } = await import(
            '../features/auth/pages/RegisterPage'
          )

          return {
            Component: RegisterPage,
          }
        },
      },
      ...developmentRoutes,
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
