// Diet Mate Service Worker for Push Notifications
const CACHE_NAME = 'diet-mate-v1';

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker 설치됨');
    self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker 활성화됨');
    event.waitUntil(clients.claim());
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
    console.log('📬 푸시 알림 수신:', event);
    
    let data = {
        title: 'Diet Mate',
        body: '알림이 도착했습니다',
        icon: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png'
    };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
        badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'diet-mate-notification',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 알림 클릭:', event);
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // 이미 열린 창이 있으면 포커스
                for (const client of clientList) {
                    if (client.url.includes('index') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // 없으면 새 창 열기
                if (clients.openWindow) {
                    return clients.openWindow('./');
                }
            })
    );
});

// 백그라운드 동기화 (단식 타이머용)
self.addEventListener('sync', (event) => {
    if (event.tag === 'fasting-check') {
        event.waitUntil(checkFastingStatus());
    }
});

// 주기적 백그라운드 동기화
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'fasting-reminder') {
        event.waitUntil(checkFastingStatus());
    }
});

// 단식 상태 체크 및 알림
async function checkFastingStatus() {
    // 메인 페이지에서 단식 상태 가져오기
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'CHECK_FASTING' });
    });
}

// 메시지 수신 (메인 페이지에서)
self.addEventListener('message', (event) => {
    console.log('📩 메시지 수신:', event.data);
    
    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, tag, icon } = event.data;
        self.registration.showNotification(title, {
            body: body,
            icon: icon || 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
            vibrate: [200, 100, 200],
            tag: tag || 'diet-mate',
            renotify: true
        });
    }
    
    if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, body, delay, tag } = event.data;
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
                vibrate: [200, 100, 200],
                tag: tag || 'diet-mate-scheduled',
                renotify: true
            });
        }, delay);
    }
});
