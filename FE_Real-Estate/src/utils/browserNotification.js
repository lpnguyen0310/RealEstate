// src/utils/browserNotification.js
export function showBrowserNotification({
    title,
    body,
    link,
    icon,
    badge,
    tag,
    silent = false,
}) {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const n = new Notification(title || "Thông báo mới", {
        body,
        icon: icon || "/icons/notification-192.png", 
        badge: badge || "/icons/badge-72.png",      
        tag,                                         // tag giúp gộp thông báo trùng
        silent,
        requireInteraction: false,                   
    });

    n.onclick = () => {
        try {
            if (link) {
                const target = new URL(link, window.location.origin).href;
                window.open(target, "_self");
            } else {
                window.focus();
            }
        } finally {
            n.close();
        }
    };

    // Auto close để tránh stack lâu
    setTimeout(() => {
        try { n.close(); } catch { }
    }, 10000);
}
