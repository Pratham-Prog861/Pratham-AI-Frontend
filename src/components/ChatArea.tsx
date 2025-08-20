import { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import type { Message } from '../services/api';
import ReactMarkdown from 'react-markdown';
import UserAvatar from './UserAvatar';

interface ChatAreaProps {
  chatId: string | null;
  messages: Message[];
  chatTitle: string;
  onSendMessage: (message: string) => Promise<void>;
  onApplyAction: (messageId: string, action: string) => Promise<void>;
  onToggleSidebar: () => void; // Add this prop
  isSidebarOpen: boolean; // Add this prop
}

const ChatArea = ({
  chatId,
  messages,
  chatTitle,
  onSendMessage,
  onApplyAction,
  onToggleSidebar,
  isSidebarOpen
}: ChatAreaProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage) {
      return; // Don't send empty messages
    }

    if (!chatId) {
      return; // Don't send if no chat is selected
    }

    try {
      setIsLoading(true);
      await onSendMessage(trimmedMessage);
      setMessage(''); // Clear input only on success
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optional: Show error to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as never);
    }
  };

  const suggestions = [
    "Tell me a joke",
    "What's the weather like today?",
    "How does AI work?",
    "Write a short poem"
  ];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with persistent hamburger menu */}
      <div className="bg-white border-b p-3 sm:p-4 shadow-sm flex items-center">
        {/* Always visible on mobile, hidden on desktop */}
        <button
          onClick={onToggleSidebar}
          className="mr-3 block sm:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              // X (close) icon
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              // Hamburger icon
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        <h2 className="text-lg sm:text-xl font-semibold truncate">{chatTitle || 'New Chat'}</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto chat-container">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Welcome to Pratham AI!</h2>
            <p className="mb-6 text-sm sm:text-base text-center">
              Start a conversation by choosing a suggestion below or type your own message
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(suggestion);
                    // Optional: Auto-submit the suggestion
                    handleSubmit(new Event('submit') as never);
                  }}
                  className="bg-white border border-gray-300 rounded-lg p-2 sm:p-3 text-left hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start gap-2 sm:gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'user' && (
                  <UserAvatar 
                    username={msg.sender} 
                    size={28} 
                    className="hidden sm:block flex-shrink-0"
                  />
                )}
                
                <div 
                  className={`p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[75%] ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm sm:text-base">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] sm:text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                  
                  {msg.sender === 'ai' && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                      <button
                        onClick={() => onApplyAction(msg.id, 'concise')}
                        className="text-[10px] sm:text-xs bg-gray-200 hover:bg-gray-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded action-button"
                      >
                        Concise it
                      </button>
                      <button
                        onClick={() => onApplyAction(msg.id, 'expand')}
                        className="text-[10px] sm:text-xs bg-gray-200 hover:bg-gray-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded action-button"
                      >
                        Expand it
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'ai' && (
                  <UserAvatar 
                    username="AI" 
                    size={28}
                    className="hidden sm:block flex-shrink-0"
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white border-t p-2 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 
              text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500
              disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={!chatId || isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || !chatId || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 sm:px-4 
              py-1.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200 ease-in-out flex items-center justify-center
              min-w-[40px] sm:min-w-[48px]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6">
                <svg className="animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : (
              <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;