# Quick Chat Test Guide

## Current Status
✅ Server is running on port 8001  
✅ Chat API endpoints are working  
✅ Authentication is properly secured  
✅ Client is running on port 3000  

## Issues to Ignore
- **WebSocket error**: This is from a browser extension, not our code
- **404 image errors**: These are non-critical and have fallback handlers

## How to Test Chat Functionality

### Step 1: Open the Application
1. Open your browser and go to `http://localhost:3000`
2. You should see the Campus Connect homepage

### Step 2: Create Test Users
1. **Register User 1** (Seller):
   - Click "Login" → "Register"
   - Use email: `seller@test.com`
   - Complete registration
   - Add a product (go to "Sell Items" in profile dropdown)

2. **Register User 2** (Buyer):
   - Log out
   - Register with email: `buyer@test.com`
   - Complete registration

### Step 3: Test Chat Features
1. **From Product Detail Page**:
   - Browse to `/collection`
   - Click on a product
   - Click "Start Chat" button
   - Chat modal should open

2. **From Product Cards**:
   - On collection page, click chat icon (message bubble)
   - Chat modal should open

3. **From My Chats**:
   - Click profile dropdown → "My Chats"
   - Click on any conversation to open chat

### Step 4: Check Console Logs
Open browser console (F12) and look for:
```
ChatModal props: { isOpen: true, product: {...}, sellerId: "...", user: "..." }
Creating/fetching chat for: { productId: "...", sellerId: "...", userId: "..." }
Chat creation successful: { _id: "...", ... }
Fetching chat with ID: ...
Chat fetch successful: { _id: "...", messages: [...], ... }
```

### Expected Behavior
- ✅ Chat modal opens without errors
- ✅ Messages send and receive properly
- ✅ Real-time updates work (polling every 3 seconds)
- ✅ Unread message counts work
- ✅ Error handling works for network issues

### If You See Errors
1. **403 Forbidden**: User not logged in or trying to access wrong chat
2. **401 Unauthorized**: Session expired, log in again
3. **404 Not Found**: Chat doesn't exist, create a new one
4. **Image 404**: Non-critical, has fallback handlers

### Debugging Steps
1. Check browser console for detailed logs
2. Verify user is logged in
3. Try refreshing the page
4. Clear browser cookies if needed

## Success Indicators
- Chat modal opens smoothly
- Messages appear in real-time
- No console errors (except WebSocket extension error)
- Proper error messages for invalid actions

The chat functionality should now be fully working! 🎉 