import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageCircle, FiUser, FiClock, FiSearch } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';
import ChatModal from '../components/ChatModal';

const Chats = () => {
  const { user, getProfilePictureUrl } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: chats, isLoading, error } = useQuery(
    ['chats'],
    async () => {
      console.log('Fetching chats for user:', user?.id);
      const response = await axios.get('/api/chats');
      console.log('Chats fetched successfully:', response.data);
      return response.data;
    },
    {
      refetchInterval: 5000, // Poll every 5 seconds for new messages
      retry: 2,
      onError: (error) => {
        console.error('Chats fetch error:', error);
        console.error('Error details:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          userId: user?.id
        });
        if (error.response?.status === 401) {
          toast.error('Please log in to view your conversations');
        } else {
          toast.error('Failed to load conversations');
        }
      }
    }
  );

  const filteredChats = chats?.filter(chat => {
    // Add null checks to prevent errors
    if (!chat || !chat.product || !chat.seller || !chat.buyer) {
      console.log('Skipping invalid chat:', chat);
      return false;
    }
    
    const productTitle = chat.product?.title?.toLowerCase() || '';
    const sellerName = chat.seller?.name?.toLowerCase() || '';
    const buyerName = chat.buyer?.name?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return productTitle.includes(searchLower) || 
           sellerName.includes(searchLower) || 
           buyerName.includes(searchLower);
  }) || [];

  const handleOpenChat = (chat) => {
    // Add null checks to prevent errors
    if (!chat || !chat.buyer || !chat.seller || !chat.product) {
      console.error('Invalid chat data:', chat);
      toast.error('Invalid chat data');
      return;
    }
    
    // Check if the user is part of this chat
    const isPartOfChat = chat.buyer._id === user?.id || chat.seller._id === user?.id;
    
    if (!isPartOfChat) {
      toast.error('You do not have access to this chat');
      return;
    }
    
    console.log('Opening chat:', {
      chatId: chat._id,
      productId: chat.product._id,
      sellerId: chat.seller._id,
      userId: user?.id
    });
    
    setSelectedChat(chat);
    setShowChatModal(true);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = (chat) => {
    if (!chat?.messages || !Array.isArray(chat.messages)) {
      return 0;
    }
    return chat.messages.filter(msg => 
      msg && !msg.isRead && msg.sender && msg.sender._id !== user?.id
    ).length || 0;
  };

  const getLastMessage = (chat) => {
    if (!chat?.messages || !Array.isArray(chat.messages) || chat.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMsg = chat.messages[chat.messages.length - 1];
    if (!lastMsg || !lastMsg.content) {
      return 'No messages yet';
    }
    return lastMsg.content.length > 50 
      ? lastMsg.content.substring(0, 50) + '...' 
      : lastMsg.content;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Chats</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Conversations</h1>
          <p className="text-gray-600">
            Chat with sellers and buyers about products
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chats List */}
        {filteredChats.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredChats.map((chat) => {
              // Add null checks to prevent errors
              if (!chat || !chat.seller || !chat.buyer || !chat.product) {
                console.log('Skipping invalid chat in render:', chat);
                return null;
              }
              
              const unreadCount = getUnreadCount(chat);
              const isOwnProduct = chat.seller._id === user?.id;
              const otherUser = isOwnProduct ? chat.buyer : chat.seller;
              
              return (
                <div
                  key={chat._id}
                  onClick={() => handleOpenChat(chat)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      {/* User Avatar */}
                      {otherUser.profilePicture ? (
                        <img
                          src={getProfilePictureUrl(otherUser._id)}
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ${otherUser.profilePicture ? 'hidden' : ''}`}>
                        <FiUser className="text-green-600" />
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {otherUser.name}
                            </h3>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {chat.product?.title || 'Unknown Product'}
                        </p>
                        
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {getLastMessage(chat)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiMessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : 'Start browsing products and chat with sellers!'
              }
            </p>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && selectedChat && (
          <ChatModal
            isOpen={showChatModal}
            onClose={() => {
              setShowChatModal(false);
              setSelectedChat(null);
            }}
            product={selectedChat.product}
            sellerId={selectedChat.seller._id}
            chatId={selectedChat._id}
          />
        )}
      </div>
    </div>
  );
};

export default Chats; 