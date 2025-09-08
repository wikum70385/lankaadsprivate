
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Image, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

interface Message {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image';
}

interface User {
  id: string;
  nickname: string;
  gender: 'male' | 'female' | 'couple';
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image') => void;
  currentUser: User;
}

const ChatInterface = ({ messages, onSendMessage, currentUser }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSendMessage(event.target.result as string, 'image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojis(false);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white/50 backdrop-blur-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 animate-fade-in">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.userId === currentUser.id;
            const isSystem = message.userId === 'system';
            if (isSystem) {
              return (
                <div
                  key={message.id}
                  className="flex justify-center animate-fade-in my-2"
                >
                  <div className="max-w-md px-6 py-2 rounded-lg font-semibold text-center text-blue-700 bg-gradient-to-r from-sky-100 to-blue-50 border border-blue-200 shadow-none text-base">
                    {message.content}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={message.id}
                className={`flex animate-fade-in ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-xs lg:max-w-md p-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-green-200 to-green-100 text-gray-900 border-0'
                    : 'bg-gradient-to-r from-blue-200 to-blue-100 text-gray-900 border-0'
                }`}>
                  {!isCurrentUser && (
                    <div className="text-xs font-medium mb-1 text-gray-700">
                      {message.nickname}
                    </div>
                  )}
                  {message.type === 'image' ? (
                    <img
                      src={message.content}
                      alt="Shared image"
                      className="max-w-full h-auto rounded-lg transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="break-words">{message.content}</div>
                  )}
                  <div className="text-xs mt-1 text-gray-500">
                    {formatTime(message.timestamp)}
                  </div>
                </Card>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-rose-200 bg-white/90 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => {
                if (e.target.value.length <= 100) setInputValue(e.target.value);
              }}
              maxLength={100}
              className="pr-20 border-rose-200 focus:border-rose-400 focus:ring-rose-400 transition-all duration-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
              onPaste={(e) => {
                const paste = e.clipboardData.getData('text');
                if ((inputValue.length + paste.length) > 100) {
                  e.preventDefault();
                  setInputValue((inputValue + paste).slice(0, 100));
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-1 h-8 w-8 text-gray-500 hover:text-rose-500 transition-all duration-300 hover:scale-110"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 h-8 w-8 text-gray-500 hover:text-rose-500 transition-all duration-300 hover:scale-110"
              >
                <Image className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {showEmojis && (
          <div className="animate-scale-in">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojis(false)} />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ChatInterface;
