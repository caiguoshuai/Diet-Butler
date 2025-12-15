const CACHE_NAME = 'meal-master-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 预缓存核心文件
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 激活 Service Worker，清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 对于 API 调用或其他非 GET 请求，直接通过网络
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 策略：网络优先，缓存兜底 (Network First, falling back to Cache)
      // 这样可以确保用户尽可能看到最新内容，离线时再用缓存
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // 如果网络请求成功，更新缓存
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 网络失败（离线），使用缓存
        return cachedResponse;
      });

      // 如果有缓存，也可以选择先返回缓存（Stale-while-revalidate），
      // 但为了数据一致性，这里我们优先等待网络（如果网络很快），
      // 或者您可以直接返回 fetchPromise（上面已经包含了 catch 逻辑）
      return fetchPromise; 
    })
  );
});