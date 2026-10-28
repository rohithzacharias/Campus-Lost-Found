import { createSlice } from '@reduxjs/toolkit';

// Safely load initial state from localStorage
const getSavedAuth = () => {
  try {
    const savedUser = localStorage.getItem('campusfind_user');
    const savedToken = localStorage.getItem('campusfind_token');
    if (savedUser && savedToken) {
      return {
        user: JSON.parse(savedUser),
        token: savedToken,
        isAuthenticated: true
      };
    }
  } catch (e) {
    console.error('Error loading auth from localStorage:', e);
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false
  };
};

const userSlice = createSlice({
  name: 'user',
  initialState: getSavedAuth(),
  reducers: {
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      try {
        localStorage.setItem('campusfind_user', JSON.stringify(user));
        localStorage.setItem('campusfind_token', token);
      } catch (e) {
        console.error('Failed to save auth to localStorage:', e);
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      try {
        localStorage.removeItem('campusfind_user');
        localStorage.removeItem('campusfind_token');
      } catch (e) {
        console.error('Failed to clear auth from localStorage:', e);
      }
    }
  }
});

export const { setCredentials, logout } = userSlice.actions;
export default userSlice.reducer;
