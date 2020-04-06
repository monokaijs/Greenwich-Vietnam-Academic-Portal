var routes = [
  // Index page
  {
    path: '/',
    url: './index.html',
    name: 'home',
  },
  {
    path: '/home/',
    url: './pages/tabs/home.html',
  },
  {
    path: '/about/',
    url: './pages/about.html',
  },
  {
    path: '/settings/',
    url: './pages/tabs/settings.html',
  },
  {
    path: '/grade/',
    url: './pages/tabs/grade.html',
  },
  {
    path: '/notifications/',
    url: './pages/tabs/notifications.html',
  },
  {
    path: '(.*)',
    url: './pages/404.html',
  },
];
