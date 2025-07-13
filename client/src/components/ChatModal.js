import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { FiSend, FiX, FiUser, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../axios';

const ChatModal = ({ isOpen, onClose, product, sellerId, chatId: propChatId }) => {
  const { user, getProfilePictureUrl } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(propChatId || null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('ChatModal props:', { isOpen, product, sellerId, propChatId, user: user?.id });
  }, [isOpen, product, sellerId, propChatId, user?.id]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setChatId(propChatId || null);
      setIsCreatingChat(false);
    } else {
      // When opening, validate the chatId if provided
      if (propChatId && !propChatId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Invalid chat ID format:', propChatId);
        setChatId(null);
        toast.error('Invalid chat ID');
      }
    }
  }, [isOpen, propChatId]);

  // Create or get existing chat if no chatId is provided
  const createOrFetchChat = useMutation(
    async () => {
      if (!product?._id || !sellerId) {
        throw new Error('Product or seller information is missing');
      }
      console.log('Creating/fetching chat for:', {
        productId: product._id,
        sellerId: sellerId,
        userId: user?.id
      });
      const response = await axios.post('/api/chats', {
        productId: product._id,
        sellerId: sellerId
      });
      console.log('Chat creation successful:', response.data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        console.log('Chat created/fetched successfully:', data._id);
        setChatId(data._id);
        setIsCreatingChat(false);
        queryClient.invalidateQueries(['chat', data._id]);
        toast.success('Chat started successfully!');
      },
      onError: (error) => {
        console.error('Chat creation error:', error);
        console.error('Error details:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          productId: product?._id,
          sellerId: sellerId,
          userId: user?.id
        });
        toast.error(error.response?.data?.message || 'Failed to start chat');
        setIsCreatingChat(false);
      },
    }
  );

  // Fetch chat if chatId is available
  const { data: chat, isLoading: isLoadingChat, error: chatError } = useQuery(
    ['chat', chatId],
    async () => {
      console.log('Fetching chat with ID:', chatId);
      const response = await axios.get(`/api/chats/${chatId}`);
      console.log('Chat fetch successful:', response.data);
      return response.data;
    },
    {
      enabled: !!chatId,
      refetchInterval: 3000, // Poll every 3 seconds for new messages
      retry: 1,
      onError: (error) => {
        console.error('Chat fetch error:', error);
        console.error('Error details:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          chatId: chatId,
          user: user?.id
        });
        if (error.response?.status === 403) {
          console.log('Access denied - creating new chat instead');
          // If access denied, clear the chatId and create a new chat
          setChatId(null);
          if (product && sellerId && user?.id !== sellerId) {
            setIsCreatingChat(true);
            createOrFetchChat.mutate();
          }
        } else {
          toast.error('Failed to load chat messages');
        }
      }
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (content) => {
      console.log('Sending message:', content, 'to chat:', chatId);
      await axios.post(`/api/chats/${chatId}/messages`, { content });
    },
    {
      onSuccess: () => {
        console.log('Message sent successfully');
        queryClient.invalidateQueries(['chat', chatId]);
        setMessage('');
      },
      onError: (error) => {
        console.error('Message send error:', error);
        toast.error(error.response?.data?.message || 'Failed to send message');
      },
    }
  );

  // Mark messages as read
  const markAsReadMutation = useMutation(
    async () => {
      console.log('Marking messages as read for chat:', chatId);
      await axios.put(`/api/chats/${chatId}/read`);
    },
    {
      onSuccess: () => {
        console.log('Messages marked as read');
        queryClient.invalidateQueries(['chat', chatId]);
      },
      onError: (error) => {
        console.error('Mark as read error:', error);
      },
    }
  );

  // On open, if no chatId, create or fetch chat
  useEffect(() => {
    if (isOpen && !chatId && !isCreatingChat && product && sellerId && !propChatId) {
      // Check if user is trying to chat with themselves
      if (user?.id === sellerId) {
        toast.error('You cannot chat with yourself');
        onClose();
        return;
      }
      
      // Check if we have all required data
      if (!product._id || !sellerId || !user?.id) {
        console.log('Missing required data for chat creation:', {
          productId: product._id,
          sellerId: sellerId,
          userId: user?.id
        });
        toast.error('Unable to start chat - missing information');
        onClose();
        return;
      }
      
      console.log('Starting chat creation...');
      setIsCreatingChat(true);
      createOrFetchChat.mutate();
    }
  }, [isOpen, chatId, isCreatingChat, product, sellerId, propChatId, user?.id, onClose]);

  // Mark as read when chat is loaded
  useEffect(() => {
    if (chat && chatId && isOpen) {
      markAsReadMutation.mutate();
    }
    // eslint-disable-next-line
  }, [chat, chatId, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;
    sendMessageMutation.mutate(message.trim());
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get the other person's info (seller or buyer)
  const getOtherPerson = () => {
    if (chat) {
      return chat.buyer._id === user?.id ? chat.seller : chat.buyer;
    }
    return product?.seller;
  };

  const otherPerson = getOtherPerson();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-black-800 rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col border border-primary-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-700 bg-black-900">
          <div className="flex items-center space-x-3">
            {otherPerson?.profilePicture ? (
              <img
                src={getProfilePictureUrl(otherPerson._id)}
                alt={otherPerson.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center ${otherPerson?.profilePicture ? 'hidden' : ''}`}>
              <FiUser className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-500">
                Chat with {otherPerson?.name || 'Seller'}
              </h3>
              <p className="text-sm text-primary-200">{product?.title || chat?.product?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-200 hover:text-primary-500 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isCreatingChat ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-2 text-primary-200">Starting chat...</p>
            </div>
          ) : isLoadingChat ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-2 text-primary-200">Loading messages...</p>
            </div>
          ) : chatError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <p>Failed to load chat</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : chat?.messages?.length > 0 ? (
            chat.messages.map((msg, index) => {
              const isOwnMessage = msg.sender._id === user?.id;
              return (
                <div
                  key={index}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                >
                  {!isOwnMessage && (
                    <div className="flex-shrink-0">
                      {msg.sender.profilePicture ? (
                        <img
                          src={getProfilePictureUrl(msg.sender._id)}
                          alt={msg.sender.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ${msg.sender.profilePicture ? 'hidden' : ''}`}>
                        <FiUser className="text-gray-500 w-4 h-4" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                  {isOwnMessage && (
                    <div className="flex-shrink-0">
                      {user?.hasProfilePicture ? (
                        <img
                          src={getProfilePictureUrl(user.id)}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center ${user?.hasProfilePicture ? 'hidden' : ''}`}>
                        <FiUser className="text-primary-600 w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FiMessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!chatId || sendMessageMutation.isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || !chatId || sendMessageMutation.isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal; 