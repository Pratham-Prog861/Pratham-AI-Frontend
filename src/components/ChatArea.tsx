import { useState, useRef, useEffect } from 'react';
import { FiSend, FiCopy, FiCheck, FiMic, FiMicOff } from 'react-icons/fi';
import type { Message } from '../services/api';
import ReactMarkdown from 'react-markdown';
import UserAvatar from './UserAvatar';


declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ChatAreaProps {
  chatId: string | null;
  messages: Message[];
  chatTitle: string;
  onSendMessage: (message: string) => Promise<void>;
  onApplyAction: (messageId: string, action: string) => Promise<void>;
  onToggleSidebar: () => void; 
  isSidebarOpen: boolean; 
  onAddMessage?: (message: Message) => void; // Add this prop for direct message addition
}

const ChatArea = ({
  chatId,
  messages,
  chatTitle,
  onSendMessage,
  onApplyAction,
  onToggleSidebar,
  isSidebarOpen,
  onAddMessage
}: ChatAreaProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if speech recognition is supported
  useEffect(() => {
    console.log('Checking speech recognition support...'); 
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('SpeechRecognition available:', !!SpeechRecognition); 
    console.log('window.SpeechRecognition:', !!window.SpeechRecognition); 
    console.log('window.webkitSpeechRecognition:', !!window.webkitSpeechRecognition); 
    
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      console.log('Creating speech recognition instance...'); 
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true; 
      recognitionRef.current.lang = 'en-US';
      
      console.log('Speech recognition instance created:', recognitionRef.current); 
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Speech recognition result:', event); 
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('Final transcript:', finalTranscript); 
        console.log('Interim transcript:', interimTranscript);
        
        setInterimTranscript(interimTranscript);
        
        if (finalTranscript) {
          setMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
          setInterimTranscript(''); 
          adjustTextareaHeight();
        }
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.log('Full error event:', event);
        
        if (event.error === 'network' || event.error === 'not-allowed') {
          setIsListening(false);
          setInterimTranscript('');
        }
      };
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started'); 
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended'); 

        if (isListening) {

          if (interimTranscript.trim()) {
            setMessage(prev => prev + (prev ? ' ' : '') + interimTranscript.trim());
            setInterimTranscript('');
            adjustTextareaHeight();
          }
  
          try {
            recognitionRef.current?.start();
          } catch (error) {
            console.log('Auto-restart failed:', error);
            setIsListening(false);
          }
        }
      };
      
      console.log('Speech recognition setup complete'); 
    } else {
      console.log('Speech recognition not supported');
      setIsSpeechSupported(false);
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          console.log('Cleanup: Speech recognition already stopped');
        }
      }
    };
  }, [interimTranscript, isListening]);

  // Handle copy animation timeout
  useEffect(() => {
    if (copiedMessageId) {
      const timer = setTimeout(() => {
        setCopiedMessageId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  // Handle toast timeout
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setShowToast(true);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageId(messageId);
      setShowToast(true);
    }
  };

  const toggleVoice = () => {
    console.log('Toggle voice called, current state:', isListening); 
    if (!isSpeechSupported || !recognitionRef.current) {
      console.log('Speech recognition not available'); 
      return;
    }
    
    if (isListening) {
      console.log('Stopping speech recognition'); 
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setInterimTranscript(''); 
        console.log('Speech recognition stopped successfully'); 
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
        setIsListening(false);
        setInterimTranscript('');
      }
    } else {
      // Start listening
      console.log('Starting speech recognition');
      try {
        setInterimTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Speech recognition started successfully');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage) {
      return;
    }

    if (!chatId) {
      return; 
    }

    const creatorKeywords = [
      'who made you',
      'who created you',
      'who is your creator',
      'who built you',
      'who developed you',
      'who programmed you',
      'who designed you',
      'who is the creator of you',
      'who is the maker of you',
      'who is behind you'
    ];
    
    const isAskingAboutCreator = creatorKeywords.some(keyword => 
      trimmedMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isAskingAboutCreator) {
      // First, add the user's question to the chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: trimmedMessage,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Create a direct response about Pratham Darji
      const creatorResponse = `🎉 **I'm proud to announce that I was created by Pratham Darji!** 

🚀 **About My Creator:**
• **Pratham Darji** - A passionate Frontend Developer and AI enthusiast
• **Expertise:** React.js, Next.js, Node.js, TypeScript, Tailwind CSS
• **Full-Stack Explorer** with experience in MERN Stack (MongoDB, Express.js, React.js, Node.js)
• **AI & Machine Learning** enthusiast currently learning Python and AI technologies
• **Innovation-driven** developer passionate about learning and creating cutting-edge solutions

🔗 **Connect with Pratham:**
• **LinkedIn:** [Pratham Darji](https://www.linkedin.com/in/pratham-darji-b704092a2/)
• **GitHub:** [Pratham-Prog861](https://github.com/Pratham-Prog861)
• **Portfolio:** [prathamdarji.netlify.app](https://prathamdarji.netlify.app/)

💡 **What Makes This Special:**
I'm not just another AI - I'm a testament to Pratham's growing expertise in modern web development and his curiosity about artificial intelligence. He built me as part of his journey to understand AI integration in web applications.

🌟 **Current Focus:** Pratham is actively learning AI technologies to enhance his development skills and create more intelligent applications like this one!

*Feel free to ask me anything else - I'm here to help and showcase what Pratham has built!*`;

      // Create the creator message
      const creatorMessage: Message = {
        id: `creator-${Date.now()}`,
        content: creatorResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      // Add both messages to the chat if the prop is available
      if (onAddMessage) {
        onAddMessage(userMessage);
        onAddMessage(creatorMessage);
      } else {
        // If onAddMessage is not available, we need to handle this differently
        // For now, let's just clear the message and show a console log
        console.log('Creator question detected but onAddMessage prop not available');
        console.log('User question:', trimmedMessage);
        console.log('Creator response:', creatorResponse);
      }
      
      setMessage('');
      return; // IMPORTANT: Return here to prevent sending to backend
    }

    try {
      setIsLoading(true);
      await onSendMessage(trimmedMessage);
      setMessage(''); 
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; 
      const maxRows = 6; 
      
      textareaRef.current.style.height = `${Math.min(scrollHeight, lineHeight * maxRows)}px`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as never);
    }
  };

  const suggestions = [
    "What can you do?",
    "Explain this concept simply",
    "Write a short email for me",
    "Give me some creative ideas",
    "Help me debug this code",
    "Suggest a good book to read",
    "Write a poem",
    "How does quantum computing work?",
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
                    <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      )
                    }}
                    >{msg.content}</ReactMarkdown>
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
                        className="text-[10px] sm:text-xs bg-white hover:bg-gray-600 text-black hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg action-button border border-gray-600 hover:border-gray-500"
                      >
                        Concise it
                      </button>
                      <button
                        onClick={() => onApplyAction(msg.id, 'expand')}
                        className="text-[10px] sm:text-xs bg-white hover:bg-gray-600 text-black hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg action-button border border-gray-600 hover:border-gray-500"
                      >
                        Expand it
                      </button>
                      <button
                        onClick={() => handleCopyMessage(msg.content, msg.id)}
                        className="text-[10px] sm:text-xs bg-white hover:bg-gray-600 text-black hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg action-button flex items-center gap-1.5 transition-all duration-200 border border-gray-600 hover:border-gray-500"
                        title="Copy to clipboard"
                      >
                        {copiedMessageId === msg.id ? (
                          <FiCheck className="w-3 h-3 text-green-400" />
                        ) : (
                          <FiCopy className="w-3 h-3" />
                        )}
                        {copiedMessageId === msg.id ? 'Copied!' : 'Copy'}
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
          <textarea
            ref={textareaRef}
            value={message + (interimTranscript ? ` ${interimTranscript}` : '')}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening... Speak now" : "Type your message... (Shift+Enter for new line)"}
            className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 
              text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500
              disabled:bg-gray-100 disabled:cursor-not-allowed resize-none overflow-hidden"
            disabled={!chatId || isLoading}
            rows={1}
            style={{ minHeight: '40px', maxHeight: '144px' }}
          />
          
          {/* Voice input button */}
          {isSpeechSupported ? (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={!chatId || isLoading}
              className={`p-2 sm:p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center min-w-[40px] sm:min-w-[44px] ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <FiMicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <FiMic className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          ) : (
            <div className="p-2 sm:p-2.5 text-xs text-gray-500 bg-gray-100 rounded-lg border border-gray-300">
              Voice not supported
            </div>
          )}
          
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

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-17 ml-17 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-fade-in backdrop-blur-sm bg-opacity-95 sm:top-20 sm:ml-38 sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-medium">Copied to clipboard!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;