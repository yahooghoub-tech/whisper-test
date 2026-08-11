
self.addEventListener("install", event => {
    console.log("Service Worker نصب شد");
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    console.log("Service Worker فعال شد");
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {

    let data = {
        title: "📢 فراخوان جدید",
        body: "یک دانش‌آموز فراخوان شد"
    };

    if(event.data){
        try{
            data = event.data.json();
        }catch(error){
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: "icon-192.png",
        badge: "icon-192.png",
        vibrate: [200,100,200],
        tag: "student-call",
        renotify: true,
        requireInteraction: true,
        data: {
            url: "./teacher-6-1.html"
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title,
            options
        )
    );
});

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(clientList => {

            for(const client of clientList){

                if("focus" in client){
                    return client.focus();
                }

            }

            if(clients.openWindow){
                return clients.openWindow(
                    "./teacher-6-1.html"
                );
            }

        })
    );

});
