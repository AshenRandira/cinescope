import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { DiscoverPage } from '../features/discovery/pages/DiscoverPage'
import { HomePage } from '../features/discovery/pages/HomePage'
import { MoviesPage } from '../features/discovery/pages/MoviesPage'
import { TvShowsPage } from '../features/discovery/pages/TvShowsPage'
import { LibraryPage } from '../features/library/pages/LibraryPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { SearchPage } from '../features/search/pages/SearchPage'
import { NotFoundPage } from '../pages/NotFoundPage'

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
        path: 'tv',
        element: <TvShowsPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
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
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
