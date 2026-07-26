# 🔐 Authentication System Guide

## ✅ What's Been Implemented

Your StockPilot frontend now has a **complete authentication system** with:

### 1. **Login Page** (`/login`)
- 🎨 Beautiful dark-themed login form
- 📧 Email & password fields
- 👁️ Show/hide password toggle
- 💾 "Remember me" checkbox
- 🔑 Forgot password link
- 🐱 Social login buttons (GitHub, Google - UI ready)
- ✨ Animated error messages
- 🔄 Loading states with spinner
- 📱 Fully responsive design

### 2. **Registration Page** (`/register`)
- 👤 Full name, email, password fields
- 🔐 Password strength indicator
- ✅ Real-time password match validation
- 📋 Terms & Privacy agreement checkbox
- 🎨 Clean, modern UI
- 📱 Mobile responsive

### 3. **Auth Context** (`src/contexts/AuthContext.jsx`)
Global state management for authentication:
- ✅ User data (name, email, role, avatar)
- 🔑 Token management
- 🔒 Persistent login (localStorage)
- 📍 Auth hook (`useAuth()`)

### 4. **Protected Routes** (`src/components/ProtectedRoute.jsx`)
- ✅ Automatic redirect to login for unauthenticated users
- ⏳ Loading state while checking authentication
- 🛡️ Secure all app routes

### 5. **Updated Navbar**
- 👤 Shows logged-in user avatar and name
- 🚪 Logout button in dropdown menu
- 🔗 Links to profile and settings

### 6. **Auth Service** (`src/services/authService.js`)
Prepared for backend integration:
- `login(email, password)`
- `register(name, email, password)`
- `verifyToken(token)`
- `logout()`

---

## 🚀 How to Use

### Access the Application

1. **Start the dev server** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open in browser**:
   ```
   http://localhost:5173
   ```

3. **You'll see the Login page**
   - Use ANY email and password (mock mode)
   - Example: `test@example.com` / `password123`

### Test Features

#### Login Flow
1. Go to `/login`
2. Enter email and password
3. Click "Sign In"
4. ✅ Redirected to dashboard
5. Check navbar for your user info

#### Registration Flow
1. Click "Sign up here" link
2. Fill in name, email, password
3. Confirm password matches (indicator shows ✅)
4. Accept terms
5. Click "Create Account"
6. ✅ Auto-logged in and redirected

#### Logout
1. Click user profile icon (top right)
2. Click "Sign out"
3. ✅ Redirected to login page
4. User data cleared

#### Session Persistence
1. Login successfully
2. Refresh the page (F5)
3. ✅ Still logged in! (stored in localStorage)
4. Close browser & reopen
5. ✅ Session persists

---

## 📁 New Files Created

```
frontend/src/
├── contexts/
│   └── AuthContext.jsx          # Auth state management
│
├── components/
│   └── ProtectedRoute.jsx       # Route protection wrapper
│
├── pages/
│   ├── Login.jsx               # Login page
│   └── Register.jsx            # Registration page
│
└── services/
    └── authService.js          # Auth API integration layer
```

---

## 🔄 How Authentication Works

### 1. **User Logs In**
   - AuthContext receives credentials
   - Mock function processes them
   - User & token stored in localStorage
   - App state updated

### 2. **Protected Routes Check**
   - App.jsx wraps routes with ProtectedRoute
   - ProtectedRoute checks `useAuth().isAuthenticated`
   - If false → redirects to `/login`
   - If true → renders dashboard

### 3. **Navigation**
   - All routes require authentication
   - `/login` & `/register` are public
   - Everything else is protected
   - Auto-redirect on load

---

## 🔌 Connecting Your Backend

Once your backend API is ready:

### Step 1: Update Auth Service
File: `src/services/authService.js`

Replace mock calls with real API endpoints:

```javascript
async login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  return data; // Should return { success, user, token }
}
```

### Step 2: Update Backend Endpoint

Your backend should return:
```json
{
  "success": true,
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  },
  "token": "jwt_token_here"
}
```

### Step 3: Update Environment
Create `.env.local` in frontend:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🎨 Customization

### Change Login Theme
File: `src/pages/Login.jsx`
- Update gradient colors (line 16)
- Modify button colors
- Change logo/icon

### Add Social Login
Files to update:
- `src/pages/Login.jsx` (line 133)
- `src/services/authService.js` (add OAuth methods)

### Add Two-Factor Authentication
1. Create `src/pages/TwoFactor.jsx`
2. Add `2fa_method` to user state
3. Update flow in AuthContext

### Add Forgot Password
Create `src/pages/ForgotPassword.jsx`:
```jsx
// Request password reset
// Check email for reset link
// Create new password
```

---

## 📦 Required Backend Endpoints

For full integration, implement these endpoints:

### 1. **POST /auth/login**
   - Input: `{ email, password }`
   - Output: `{ success, user, token }`

### 2. **POST /auth/register**
   - Input: `{ name, email, password }`
   - Output: `{ success, user, token }`

### 3. **POST /auth/verify**
   - Input: Token in Authorization header
   - Output: `{ valid, user }`

### 4. **POST /auth/logout**
   - Input: Token in Authorization header
   - Output: `{ success }`

### 5. **POST /auth/refresh-token**
   - Input: Token in Authorization header
   - Output: `{ token }`

---

## 🛡️ Security Best Practices

✅ **Already Implemented:**
- Password strength validation
- Secure password field (masked)
- Token storage in localStorage (note: consider httpOnly cookies for production)
- Automatic route protection

⚠️ **Todo for Backend:**
- ✅ Hash passwords with bcrypt
- ✅ Validate input on server
- ✅ Implement JWT tokens
- ✅ Add HTTPS only in production
- ✅ Refresh token rotation
- ✅ CORS configuration

---

## 🧪 Testing Scenarios

### Scenario 1: Fresh User
1. Clear localStorage: `localStorage.clear()`
2. Close & reopen browser
3. Should see login page
4. ✅ Session lost

### Scenario 2: Happy Path
1. Register new account
2. Login
3. Navigate around app
4. Refresh page
5. ✅ Still logged in

### Scenario 3: Unauthorized Access
1. Logout
2. Try to access `/dashboard` via URL bar
3. ✅ Auto-redirect to `/login`

### Scenario 4: Token Expiry
1. Login
2. Manually delete `authToken` from localStorage
3. Refresh page
4. ✅ Auto-redirect to login

---

## 🐛 Troubleshooting

### "useAuth must be used within AuthProvider"
- Make sure `<AuthProvider>` wraps the entire app (in App.jsx)
- ✅ Already done

### Components not showing user info
- Check if component uses `const { user } = useAuth()`
- Ensure component is inside protected route
- Check localStorage is not blocked

### Logout not working
- Verify `handleLogout()` is called
- Check localStorage is cleared
- Ensure navigation to `/login` works

### Remember me not working
- Check browser allows localStorage
- Check for private/incognito mode
- Clear site data and retry

---

## 📊 Current Status

✅ **Completed:**
- Login page with validation
- Register page with password strength
- Auth context & hooks
- Protected routes
- Navbar integration
- Token persistence
- Mock authentication
- Error handling
- Loading states

🎯 **Next Steps:**
1. Build backend API endpoints
2. Update authService with real API calls
3. Add refresh token logic
4. Implement password reset flow
5. Add social login
6. Implement 2FA
7. Add audit logging

---

## 📞 Need Help?

### Check These Files:
- **Auth Logic**: `src/contexts/AuthContext.jsx`
- **Login UI**: `src/pages/Login.jsx`
- **Routes**: `src/App.jsx`
- **API Ready**: `src/services/authService.js`

### Common Tasks:
- **Add new role**: Update user object in AuthContext
- **Change redirect**: Modify `ProtectedRoute.jsx` (line 19)
- **Update API URL**: Edit `authService.js` (line 1)

---

## 🎉 You're All Set!

Your authentication system is **production-ready** for backend integration!

**Next task**: Build the backend API with authentication endpoints.

Good luck! 🚀
