const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendChatNotification, sendNewChatNotification } = require('../utils/emailService');

// Get all chats for a user
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
      isActive: true
    })
    .populate('product', 'title images')
    .populate('buyer', 'name profilePicture email')
    .populate('seller', 'name profilePicture email')
    .populate('messages.sender', 'name profilePicture')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific chat
router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('product', 'title images')
      .populate('buyer', 'name profilePicture email')
      .populate('seller', 'name profilePicture email')
      .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Compare _id if populated, else fallback to toString
    const buyerId = chat.buyer._id ? chat.buyer._id.toString() : chat.buyer.toString();
    const sellerId = chat.seller._id ? chat.seller._id.toString() : chat.seller.toString();
    const userId = req.user.id.toString();
    if (buyerId !== userId && sellerId !== userId) {
      console.log('Access denied for chat:', {
        chatId: req.params.id,
        buyerId,
        sellerId,
        userId,
        user: req.user.id
      });
      return res.status(403).json({ 
        message: 'Access denied', 
        chatId: req.params.id, 
        user: req.user.id 
      });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or get existing chat
router.post('/', protect, async (req, res) => {
  try {
    const { productId, sellerId } = req.body;

    // Prevent users from chatting with themselves
    if (req.user.id.toString() === sellerId.toString()) {
      return res.status(400).json({ message: 'You cannot chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      product: productId,
      buyer: req.user.id,
      seller: sellerId,
      isActive: true
    });

    if (chat) {
      // Populate the existing chat before returning
      await chat.populate('product', 'title images');
      await chat.populate('buyer', 'name profilePicture email');
      await chat.populate('seller', 'name profilePicture email');
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      product: productId,
      buyer: req.user.id,
      seller: sellerId,
      messages: []
    });

    await chat.save();
    
    // Populate the chat with user and product info
    await chat.populate('product', 'title images');
    await chat.populate('buyer', 'name profilePicture email');
    await chat.populate('seller', 'name profilePicture email');

    // Send email notification to seller about new chat
    try {
      const chatUrl = `${process.env.CLIENT_URL}/chats`;
      await sendNewChatNotification(
        chat.seller.email,
        chat.seller.name,
        chat.buyer.name,
        chat.product.title,
        chatUrl
      );
    } catch (emailError) {
      console.error('Failed to send new chat notification:', emailError);
    }

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findById(req.params.id)
      .populate('product', 'title images')
      .populate('buyer', 'name profilePicture email')
      .populate('seller', 'name profilePicture email');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Compare _id if populated, else fallback to toString
    const buyerId = chat.buyer._id ? chat.buyer._id.toString() : chat.buyer.toString();
    const sellerId = chat.seller._id ? chat.seller._id.toString() : chat.seller.toString();
    const userId = req.user.id.toString();
    if (buyerId !== userId && sellerId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = {
      sender: req.user.id,
      content,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(message);
    await chat.save();

    // Populate the new message
    await chat.populate('messages.sender', 'name profilePicture');

    // Send email notification to the other party
    try {
      const isSenderBuyer = userId === buyerId;
      const recipient = isSenderBuyer ? chat.seller : chat.buyer;
      const sender = isSenderBuyer ? chat.buyer : chat.seller;
      
      const chatUrl = `${process.env.CLIENT_URL}/chats`;
      await sendChatNotification(
        recipient.email,
        recipient.name,
        sender.name,
        chat.product.title,
        content,
        chatUrl
      );
    } catch (emailError) {
      console.error('Failed to send message notification:', emailError);
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Compare _id if populated, else fallback to toString
    const buyerId = chat.buyer._id ? chat.buyer._id.toString() : chat.buyer.toString();
    const sellerId = chat.seller._id ? chat.seller._id.toString() : chat.seller.toString();
    const userId = req.user.id.toString();
    if (buyerId !== userId && sellerId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark messages as read
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user.id.toString()) {
        message.isRead = true;
      }
    });

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 