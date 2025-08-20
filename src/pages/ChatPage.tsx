import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Chat } from '../services/api';
import { AxiosError } from 'axios';


const ChatPage = () => {
  const { username, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        
        // Select the most recent chat if available
        if (fetchedChats.length > 0 && !currentChatId) {
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
  }, [username, isLoggedIn, navigate, currentChatId]);

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
    if (!username || !currentChatId) return;
    
    try {
      const { userMessage, aiResponse } = await api.sendMessage(username, currentChatId, message);
      
      // Update the chats state with the new messages
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, userMessage, aiResponse],
              // Update title if it's the first message
              title: chat.messages.length === 0 ? message.substring(0, 30) + (message.length > 30 ? '...' : '') : chat.title
            };
          }
          return chat;
        });
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
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
    <div className="flex h-screen">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onDeleteAllChats={handleDeleteAllChats}
      />
      
      <div className="flex-1">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError('')}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}
        
        {currentChatId && currentChat ? (
          <ChatArea
            chatId={currentChatId}
            messages={currentChat.messages}
            chatTitle={currentChat.title}
            onSendMessage={handleSendMessage}
            onApplyAction={handleApplyAction}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Welcome to Pratham AI</h2>
              <p className="text-gray-600 mb-6">Start a new chat or select an existing one</p>
              <button
                onClick={handleNewChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-md transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;