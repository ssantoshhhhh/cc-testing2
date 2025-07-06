# Order Status Notification System

## Overview
This system provides audio notifications to users when their order status changes. When an admin confirms or cancels an order, the user will receive an audio notification automatically.

## Features

### Audio Notifications
- **Order Confirmed**: Plays `confimed.mp3` when an order status changes from "pending" to "confirmed"
- **Order Cancelled**: Plays `rejected.mp3` when an order status changes to "cancelled"
- **Auto-Enabled**: Audio notifications are enabled by default - no manual activation required

### User Experience
- **Automatic Detection**: The system automatically detects order status changes through polling
- **Cross-Component Support**: Works across OrderHistory, OrderDetail, and Profile pages
- **Seamless Integration**: No user interaction required to enable notifications

## Implementation Details

### Files Modified
1. **`client/src/hooks/useOrderNotifications.js`** - Custom hook for managing audio notifications
2. **`client/src/pages/OrderHistory.js`** - Added notification system for order list
3. **`client/src/pages/OrderDetail.js`** - Added notification system for individual order view
4. **`client/src/pages/Profile.js`** - Added notification system for profile page with recent orders

### Audio Files
- `client/public/confimed.mp3` - Played when order is confirmed
- `client/public/rejected.mp3` - Played when order is cancelled

### How It Works
1. **Auto-Enable**: Audio is automatically enabled when components mount
2. **Status Tracking**: The system tracks previous order states to detect changes
3. **Real-time Updates**: Uses React Query's polling to check for updates every 30 seconds
4. **Sound Playback**: When a status change is detected, the appropriate sound is played

### Browser Compatibility
- Works in all modern browsers
- Attempts to auto-enable audio on component mount
- Gracefully handles audio playback failures
- Falls back gracefully if autoplay is blocked by browser

## Usage
1. Navigate to any page that shows orders (Orders, Order Detail, Profile)
2. Notifications are automatically enabled
3. When an admin changes your order status, you'll hear the appropriate sound

## Technical Notes
- Uses `useRef` to track previous order states
- Implements `useEffect` to detect status changes
- Handles audio loading and playback errors gracefully
- Maintains audio state across component re-renders
- Attempts to unlock audio context automatically on mount 