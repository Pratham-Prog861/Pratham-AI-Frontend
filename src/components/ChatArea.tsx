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
}

const ChatArea = ({
  chatId,
  messages,
  chatTitle,
  onSendMessage,
  onApplyAction
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
    if (!message.trim() || !chatId || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
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
      {/* Chat header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <h2 className="text-xl font-semibold truncate">{chatTitle || 'New Chat'}</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto chat-container">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-4">No messages yet</p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'user' && (
                  <UserAvatar 
                    username={msg.sender} 
                    size={32} 
                    className="flex-shrink-0"
                  />
                )}
                
                <div 
                  className={`p-3 rounded-lg max-w-[80%] ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div className={`text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                  
                  {msg.sender === 'ai' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onApplyAction(msg.id, 'concise')}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded action-button"
                      >
                        Concise it
                      </button>
                      <button
                        onClick={() => onApplyAction(msg.id, 'expand')}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded action-button"
                      >
                        Expand it
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'ai' && (
                  <UserAvatar 
                    username="AI" 
                    size={32} 
                    className="flex-shrink-0"
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!chatId || isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || !chatId || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center h-6 w-6 animate-spin">⌛</span>
            ) : (
              <FiSend />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;