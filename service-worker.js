/*
 * Offline app-shell cache for static hosting over HTTPS or localhost.
 * Keep the asset list in sync with the files required to use Cadence.
 */
const CACHE_NAME = 'cadence-offline-v1';
const APP_SHELL = ['index.html', 'how-to-use.html', 'styles.css', 'app.js'];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(APP_SHELL.map(asset => new URL(asset, self.registration.scope))))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter(name => name.startsWith('cadence-offline-') && name !== CACHE_NAME)
					.map(name => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', event => {
	const request = event.request;
	if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

	event.respondWith((async () => {
		const cached = await caches.match(request);
		if (cached && request.mode !== 'navigate') return cached;

		try {
			return await fetch(request);
		} catch (error) {
			if (cached) return cached;
			if (request.mode === 'navigate') {
				const app = new URL('index.html', self.registration.scope);
				const offlinePage = await caches.match(app);
				if (offlinePage) return offlinePage;
			}
			throw error;
		}
	})());
});
