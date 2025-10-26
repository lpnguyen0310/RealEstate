import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { notificationApi } from '@/services/notificationApi';
import { getAccessToken } from '@/utils/auth';

const WebSocketListener = () => {
  const dispatch = useDispatch();
  const stompClientRef = useRef(null);
  const token = getAccessToken();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  console.log('[WebSocketListener] Component Rendered. API_URL:', API_URL);

  useEffect(() => {
    console.log('[WebSocketListener] useEffect triggered. Token:', token);

    if (token && !stompClientRef.current) {
      console.log('[WebSocketListener] Condition MET: Token exists and no current client.');

      try {
        const wsUrl = `${API_URL}/ws`;
        console.log('[WebSocketListener] Attempting SockJS connection to:', wsUrl);

        const socketFactory = () => {
          try {
            const sock = new SockJS(wsUrl);
            console.log("[WebSocketListener] SockJS object created successfully.");
            sock.onerror = (err) => {
              console.error('[WebSocketListener] SockJS Error:', err);
            };
            return sock;
          } catch (sockJsError) {
            console.error('[WebSocketListener] Error creating SockJS object:', sockJsError);
            throw sockJsError;
          }
        };

        const client = new Client({
          webSocketFactory: socketFactory,
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
          // ⭐️ SỬA ĐỔI CHÍNH: Đặt reconnectDelay thành 0 để TẮT tự động kết nối lại
          reconnectDelay: 0,
          debug: (str) => {
            console.log('[StompJS Debug]', str);
          },
        });

        client.onConnect = (frame) => {
          console.log('[WebSocketListener] WebSocket connected successfully:', frame);
          stompClientRef.current = client;
          client.subscribe('/user/queue/notifications', (message) => {
            console.log('[WebSocketListener] Received WS message!');
            // ... xử lý message ...
          });
        };

        client.onStompError = (frame) => {
          console.error('[WebSocketListener] STOMP error:', frame.headers['message'], 'Details:', frame.body);
          stompClientRef.current = null; // Đảm bảo reset ref khi có lỗi STOMP
        };

        client.onWebSocketClose = (event) => {
          console.warn('[WebSocketListener] WebSocket closed event:', event);
          if (event && event.code) {
            console.warn(`[WebSocketListener] Close code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
          }
          // Không cần tự lên lịch kết nối lại ở đây vì reconnectDelay là 0
          stompClientRef.current = null; // Reset ref khi kết nối đóng
        };

        client.onWebSocketError = (error) => {
          console.error('[WebSocketListener] WebSocket general error:', error);
          stompClientRef.current = null; // Reset ref khi có lỗi WS
        };

        console.log('[WebSocketListener] Activating Stomp client...');
        client.activate();

        // Lưu client vào ref NGAY LẬP TỨC để cleanup có thể hoạt động nếu activate thất bại nhanh
        stompClientRef.current = client;


      } catch (error) {
        console.error('[WebSocketListener] Error during Stomp client setup/activation:', error);
        stompClientRef.current = null; // Đảm bảo reset ref nếu có lỗi ngay từ đầu
      }

    } else if (!token && stompClientRef.current) {
      console.log('[WebSocketListener] Token removed, deactivating client.');
      // Deactivate client một cách an toàn
      try {
        stompClientRef.current.deactivate();
      } catch (e) {
        console.error('[WebSocketListener] Error during deactivate on logout:', e);
      }
      stompClientRef.current = null;
    } else {
      if (!token) {
        console.log('[WebSocketListener] Condition NOT MET: No token found.');
      }
      // Không cần log 'Client already exists' vì nó có thể xảy ra giữa các lần render
    }

    // Hàm Cleanup
    return () => {
      console.log('[WebSocketListener] Cleanup function running.');
      if (stompClientRef.current) {
        console.log('[WebSocketListener] Cleanup: Deactivating client.');
        try {
          // Chỉ gọi deactivate nếu client còn tồn tại và có thể đang hoạt động
          if (stompClientRef.current.connected || stompClientRef.current.active) {
             stompClientRef.current.deactivate();
          }
        } catch (e) {
          console.error('[WebSocketListener] Error during deactivate in cleanup:', e);
        }
        stompClientRef.current = null; // Luôn reset ref trong cleanup
      }
    };
  }, [token, dispatch, API_URL]);

  return null;
};

export default WebSocketListener;