import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { createPropertyThunk } from './propertySlice'; // Import thunk của bạn
import { notificationApi } from '@/services/notificationApi'; // Import api của bạn

export const listenerMiddleware = createListenerMiddleware();

// Thêm một "listener"
listenerMiddleware.startListening({
    // 1. Lắng nghe khi hành động này THÀNH CÔNG
    actionCreator: createPropertyThunk.fulfilled,
    
    // 2. Khi nó xảy ra, chạy "effect" này
    effect: async (action, listenerApi) => {
        console.log('Property created, invalidating notification count...');
        
        // 3. Tự động dispatch action invalidate
        listenerApi.dispatch(
            notificationApi.util.invalidateTags(['UnreadCount', 'Notifications'])
        );
        
        // Bạn cũng có thể dispatch action khác nếu muốn
        // listenerApi.dispatch(showSuccessToast('Đăng tin thành công!'));
    },
});