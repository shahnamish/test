export interface NavigationLink {
  label: string;
  to: string;
}

export const navigationLinks: NavigationLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'About', to: '/about' },
];
