import {
  Compass,
  Home,
  Library,
  Search,
  UserRound,
} from 'lucide-react'

export const desktopNavigation = [
  {
    label: 'Discover',
    to: '/discover',
  },
  {
    label: 'Movies',
    to: '/movies',
  },
  {
    label: 'TV Shows',
    to: '/tv',
  },
  {
    label: 'Search',
    to: '/search',
  },
] as const

export const mobileNavigation = [
  {
    label: 'Home',
    to: '/',
    icon: Home,
    end: true,
  },
  {
    label: 'Discover',
    to: '/discover',
    icon: Compass,
    end: false,
  },
  {
    label: 'Search',
    to: '/search',
    icon: Search,
    end: false,
  },
  {
    label: 'Library',
    to: '/library',
    icon: Library,
    end: false,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: UserRound,
    end: false,
  },
] as const
