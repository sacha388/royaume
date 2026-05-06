/* Service worker minimal — notifications Web Push (iOS 16.4+ PWA, etc.) */
self.addEventListener("push", (event) => {
  let data = { title: "Royaume", body: "", url: "/home" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === "object") {
        data = {
          title: typeof parsed.title === "string" ? parsed.title : data.title,
          body: typeof parsed.body === "string" ? parsed.body : data.body,
          url: typeof parsed.url === "string" ? parsed.url : data.url,
        };
      }
    }
  } catch {
    /* garder les défauts */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || undefined,
      data: { url: data.url },
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const path = url.startsWith("/") ? url : `/${url}`;
      const fullUrl = new URL(path, self.location.origin).href;
      for (const client of clientList) {
        if (client.url === fullUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    }),
  );
});
