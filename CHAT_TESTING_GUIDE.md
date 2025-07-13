# Chat Functionality Testing Guide

## Overview
The chat functionality allows buyers to communicate with sellers about products. Here's how to test it:

## Prerequisites
1. Make sure both server and client are running:
   ```bash
   # Terminal 1 - Server
   cd server && npm start
   
   # Terminal 2 - Client  
   cd client && npm start
   ```

2. You need at least two user accounts to test the chat:
   - One seller account (to list products)
   - One buyer account (to chat with sellers)

## Testing Steps

### 1. Create Test Users
1. Register two different accounts with different email addresses
2. Log in as the first user and add a product
3. Log out and log in as the second user

### 2. Test Chat from Product Detail Page
1. Browse to `/collection` and click on a product
2. On the product detail page, click "Start Chat" button
3. The chat modal should open
4. Type a message and click send
5. Verify the message appears in the chat

### 3. Test Chat from Product Cards
1. On the collection page, click the chat icon (message bubble) on any product card
2. The chat modal should open
3. Send a message and verify it works

### 4. Test Chat from My Chats Page
1. Click on your profile dropdown (top right)
2. Click "My Chats"
3. You should see all your conversations
4. Click on any conversation to open the chat
5. Send messages and verify they appear

### 5. Test Real-time Updates
1. Open the same chat in two different browser windows/tabs
2. Send a message from one window
3. Verify the message appears in the other window within 3 seconds

## Expected Behavior

### ✅ Working Features
- Chat modal opens from product detail page
- Chat modal opens from product cards
- Chat modal opens from My Chats page
- Messages send and receive properly
- Real-time updates (polling every 3 seconds)
- Unread message counts
- Error handling for network issues
- Proper authentication checks

### ❌ Known Issues
- WebSocket error in console (browser extension, not our code)
- 404 errors for placeholder images (non-critical)

## Troubleshooting

### If chat doesn't open:
1. Make sure you're logged in
2. Check browser console for errors
3. Verify the server is running on port 8001

### If messages don't send:
1. Check if you're trying to chat with yourself (not allowed)
2. Verify the product and seller exist
3. Check browser console for API errors

### If chat doesn't load:
1. Refresh the page
2. Check if the server is running
3. Verify your authentication is valid

## API Endpoints Tested
- `GET /api/chats` - Get all chats for user
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get specific chat
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/chats/:id/read` - Mark as read

All endpoints require authentication and are working correctly. 