import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Import các service đã tạo từ file bạn đang mở
import { getMyProfile, updateMyProfile } from '@/services/profileService';
import { uploadMany } from '@/api/cloudinary';

/**
 * Thunk để upload avatar và cập nhật profile
 * @param {{ file: File, userId: string }} payload - file: File avatar, userId: ID user (để custom folder)
 */
export const uploadAvatarThunk = createAsyncThunk(
    'profile/uploadAvatar',
    async ({ file, userId }, { getState, rejectWithValue }) => {
        try {
            // 1. Upload file lên Cloudinary
            const folder = `avatars/${userId}`; // Đặt folder riêng cho avatar
            // uploadMany nhận mảng files, nên ta truyền [file]
            const uploadedImages = await uploadMany([file], folder); 
            
            if (!uploadedImages || uploadedImages.length === 0) {
                throw new Error("Cloudinary upload failed or returned no data.");
            }

            const newAvatarUrl = uploadedImages[0].secure_url;

            // 2. Cập nhật URL avatar mới vào Profile
            // Lấy profile hiện tại từ state
            const currentProfile = getState().profile.data; 

            // Gửi dữ liệu cập nhật (chỉ gửi avatar)
            const updatedData = await updateMyProfile({ 
                ...currentProfile, // Giữ lại các data cũ nếu BE cần
                avatarUrl: newAvatarUrl // Thêm/Ghi đè trường avatarUrl
            }); 
            
            // Trả về dữ liệu profile đã cập nhật
            return updatedData;

        } catch (error) {
            // Có thể xử lý lỗi cụ thể ở đây
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchMyProfile = createAsyncThunk(
  'profile/fetchMyProfile', // Tên action
  async (_, { rejectWithValue }) => {
    // Dùng thunk API để bắt lỗi
    try {
      // Gọi service của bạn
      const data = await getMyProfile();
      return data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateMyProfileThunk = createAsyncThunk(
  'profile/updateMyProfile', // Tên action
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await updateMyProfile(profileData);
      return data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 2. Định nghĩa Initial State
const initialState = {
  data: null, // Sẽ chứa dữ liệu profile (UserProfileResponse)
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null, // Sẽ chứa thông báo lỗi nếu 'failed'
};

// 3. Tạo Slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  // Reducers đồng bộ (ví dụ: clear state khi logout)
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  // Reducers bất đồng bộ (xử lý các trạng thái của thunks)
  extraReducers: (builder) => {
    builder
        // Xử lý fetchMyProfile
        .addCase(fetchMyProfile.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(fetchMyProfile.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.data = action.payload; // Gán dữ liệu profile vào state
            state.error = null;
        })
        .addCase(fetchMyProfile.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })

        // Xử lý updateMyProfileThunk
        .addCase(updateMyProfileThunk.pending, (state) => {
            state.status = 'loading'; 
        })
        .addCase(updateMyProfileThunk.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.data = action.payload; 
            state.error = null;
        })
        .addCase(updateMyProfileThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })
      // Xử lý uploadAvatarThunk
        .addCase(uploadAvatarThunk.pending, (state) => {
            state.status = 'loading'; // Có thể dùng status riêng cho upload nếu cần
        })
        .addCase(uploadAvatarThunk.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.data = action.payload; // Cập nhật profile mới (có avatarUrl)
            state.error = null;
        })
        .addCase(uploadAvatarThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
  },
});

// 4. Exports
export const { clearProfile } = profileSlice.actions;

// Export reducer để thêm vào store
export default profileSlice.reducer;
