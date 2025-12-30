import { useState, useEffect, useRef } from 'react';
import { Message, User } from '@/types/chat';
import { generateUsername, generateUserId } from '@/utils/generateUsername';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyChat from './EmptyChat';
import TypingIndicator from './TypingIndicator';

// Simulated other users for demo
const simulatedUsers = [
  { id: 'sim1', username: 'GhostRunner42' },
  { id: 'sim2', username: 'CyberPhoenix88' },
  { id: 'sim3', username: 'ShadowNinja256' },
];

const welcomeMessages: Message[] = [
  {
    id: '1',
    text: 'Welcome to the anonymous chat. No logs, no traces.',
    username: 'GhostRunner42',
    userId: 'sim1',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    text: 'Just dropped in. This place is chill.',
    username: 'CyberPhoenix88',
    userId: 'sim2',
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: '3',
    text: 'Anyone here into cybersecurity? 🔐',
    username: 'ShadowNinja256',
    userId: 'sim3',
    timestamp: new Date(Date.now() - 60000),
  },
];

const ChatRoom = () => {
  const [currentUser] = useState<User>(() => ({
    id: generateUserId(),
    username: generateUsername(),
  }));
  
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);
  const [onlineCount] = useState(Math.floor(Math.random() * 20) + 10);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate occasional responses
  useEffect(() => {
    const responses = [
      "That's interesting...",
      "I agree with that",
      "Anyone else online?",
      "Just lurking here 👀",
      "This chat is pretty cool",
      "No surveillance here, nice",
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
        
        setIsTyping(randomUser.username);
        
        setTimeout(() => {
          setIsTyping(null);
          const newMessage: Message = {
            id: Date.now().toString(),
            text: responses[Math.floor(Math.random() * responses.length)],
            username: randomUser.username,
            userId: randomUser.id,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, newMessage]);
        }, 2000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      username: currentUser.username,
      userId: currentUser.id,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader username={currentUser.username} onlineCount={onlineCount} />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <EmptyChat />
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.userId === currentUser.id}
                />
              ))}
              {isTyping && <TypingIndicator username={isTyping} />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>
      
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatRoom;
