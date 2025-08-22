import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Chat, Message } from '../services/api';
import { AxiosError } from 'axios';


const ChatPage = () => {
  const { username, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    const fetchChats = async () => {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const fetchedChats = await api.getChats(username);
        setChats(fetchedChats);
        
        // If no chats exist, create one automatically
        if (fetchedChats.length === 0) {
          const newChat = await api.createChat(username);
          setChats([newChat]);
          setCurrentChatId(newChat.id);
        } else {
          // Always select the most recent chat on initial load
          setCurrentChatId(fetchedChats[0].id);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [username, isLoggedIn, navigate]); // Remove currentChatId dependency

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId) || null;
  };

  const handleNewChat = async () => {
    if (!username) return;
    
    try {
      const newChat = await api.createChat(username);
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat.id);
    } catch (err) {
      console.error('Error creating new chat:', err);
      setError('Failed to create new chat');
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleSendMessage = async (message: string) => {
    if (!username || !currentChatId) {
      setError('Please login again or create a new chat.');
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    try {
      // Add optimistic update for user message
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        content: trimmedMessage,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, tempUserMessage]
            };
          }
          return chat;
        });
      });

      // Make API call
      const { userMessage, aiResponse, chatTitle } = await api.sendMessage(
        username,
        currentChatId,
        trimmedMessage
      );
      
      // Update chats with new messages and title
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === currentChatId) {
            const messages = chat.messages.filter(msg => !msg.id.startsWith('temp-'));
            return {
              ...chat,
              title: chatTitle || chat.title, // Update title if provided
              messages: [...messages, userMessage, aiResponse]
            };
          }
          return chat;
        });
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove temp message on error
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: chat.messages.filter(msg => !msg.id.startsWith('temp-'))
            };
          }
          return chat;
        });
      });

      // Show error message
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to send message. Please try again.');
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!username) return;
    
    try {
      await api.deleteChat(username, chatId);
      
      // Remove the chat from state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was the current one, select another chat or set to null
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete chat');
    }
  };

  const handleDeleteAllChats = async () => {
    if (!username) return;
    
    try {
      await api.deleteAllChats(username);
      setChats([]);
      setCurrentChatId(null);
    } catch (err) {
      console.error('Error deleting all chats:', err);
      setError('Failed to delete all chats');
    }
  };

  const handleApplyAction = async (messageId: string, action: string) => {
    if (!username || !currentChatId) {
      setError('Session expired. Please login again.');
      return;
    }
    
    try {
      const { message } = await api.applyAction(username, currentChatId, messageId, action);
      
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => {
                if (msg.id === messageId) {
                  return message;
                }
                return msg;
              })
            };
          }
          return chat;
        });
      });
    } catch (error) {
      console.error('Error applying action:', error);
      
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to apply action';
        setError(errorMessage);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to apply action. Please try again.');
      }
    }
  };

  const currentChat = getCurrentChat();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[#1E1E1E]">
      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:relative sm:translate-x-0
        `}
      >
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onDeleteAllChats={handleDeleteAllChats}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {/* Overlay - only on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        <ChatArea
          chatId={currentChatId}
          messages={currentChat?.messages || []}  // Add null check with default empty array
          chatTitle={currentChat?.title || 'New Chat'}  // Add null check with default title
          onSendMessage={handleSendMessage}
          onApplyAction={handleApplyAction}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onAddMessage={(message) => {
            // Add the message directly to the current chat
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat.id === currentChatId) {
                  return {
                    ...chat,
                    messages: [...chat.messages, message]
                  };
                }
                return chat;
              });
            });
          }}
        />
      </div>
    </div>
  );
};

export default ChatPage;