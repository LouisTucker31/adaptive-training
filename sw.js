/* ── Adaptive Training Service Worker ── */

const CACHE_NAME = 'adaptive-training-v1';

const PRECACHE = [
  '/adaptive-training/',
  '/adaptive-training/index.html',
  '/adaptive-training/create.html',
  '/adaptive-training/cycling.html',
  '/adaptive-training/running.html',
  '/adaptive-training/programme.html',
  '/adaptive-training/programmes.html',
  '/adaptive-training/profile.html',
  '/adaptive-training/pbs.html',
  '/adaptive-training/goals.html',
  '/adaptive-training/404.html',
  '/adaptive-training/css/base.css',
  '/adaptive-training/css/header.css',
  '/adaptive-training/css/home.css',
  '/adaptive-training/css/wizard.css',
  '/adaptive-training/css/programme.css',
  '/adaptive-training/css/profile.css',
  '/adaptive-training/css/pbs.css',
  '/adaptive-training/css/goals.css',
  '/adaptive-training/js/header.js',
  '/adaptive-training/js/home.js',
  '/adaptive-training/js/create.js',
  '/adaptive-training/js/programmes.js',
  '/adaptive-training/js/wizard.js',
  '/adaptive-training/js/cycling.js',
  '/adaptive-training/js/cycling-questions.js',
  '/adaptive-training/js/cycling-logic.js',
  '/adaptive-training/js/cycling-review.js',
  '/adaptive-training/js/running.js',
  '/adaptive-training/js/running-questions.js',
  '/adaptive-training/js/running-logic.js',
  '/adaptive-training/js/running-review.js',
  '/adaptive-training/js/programme.js',
  '/adaptive-training/js/profile.js',
  '/adaptive-training/js/pbs.js',
  '/adaptive-training/js/goals.js',
  '/adaptive-training/favicon.svg',
  '/adaptive-training/icon192.png',
  '/adaptive-training/icon512.png',
];

// Install — cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first, fall back to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/404.html'));
    })
  );
});