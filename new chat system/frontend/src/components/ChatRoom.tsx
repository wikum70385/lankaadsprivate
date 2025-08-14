
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Home, Menu } from 'lucide-react';
import ChatInterface from './ChatInterface';
import Sidebar from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface User {
  id: string;
  nickname: string;
  gender: 'male' | 'female' | 'couple';
  lastActive: string;
}

interface Message {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image';
  room?: string;
  isPrivate?: boolean;
  recipientId?: string;
  isRead?: boolean;
}

interface UnreadCounts {
  rooms: { [roomId: string]: number };
  privateChats: { [userId: string]: number };
}

interface ChatRoomProps {
  user: User;
  onLogout: () => void;
}

const ChatRoom = ({ user, onLogout }: ChatRoomProps) => {
  const [currentRoom, setCurrentRoom] = useState(() => localStorage.getItem('currentRoom') || 'public');
  const [privateChat, setPrivateChat] = useState<string | null>(() => localStorage.getItem('privateChat') || null);
  const currentRoomRef = useRef(currentRoom);
  const privateChatRef = useRef(privateChat);
  const userIdRef = useRef(user.id);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { privateChatRef.current = privateChat; }, [privateChat]);
  useEffect(() => { userIdRef.current = user.id; }, [user.id]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(() => {
    const stored = localStorage.getItem('unreadCounts');
    if (stored) return JSON.parse(stored);
    return { rooms: {}, privateChats: {} };
  });
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const rooms = [
    { id: 'public', name: 'Public Chat', icon: Home },
    { id: 'girls', name: 'Girls Chat', icon: Users },
    { id: 'boys', name: 'Boys Chat', icon: Users },
    { id: 'couple', name: 'Couple Chat', icon: Users },
  ];

  // Persist unreadCounts to localStorage on every change
  useEffect(() => {
    localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // Ensure socket connection is established after login and before handlers
  useEffect(() => {
    import('../services/socket').then(SocketService => {
      const token = localStorage.getItem('authToken');
      if (token) SocketService.default.connect(token);
    });
  }, [user.id]);

  // Set up socket event handlers ONCE on mount
  useEffect(() => {
    let isMounted = true;
    import('../services/api').then(({ userAPI }) => {
      userAPI.getOnlineUsers().then(res => {
        if (isMounted && res.data && Array.isArray(res.data.users)) {
          setOnlineUsers(res.data.users);
        }
      });
    });
    let handleOnlineUsers: ((users: User[]) => void) | null = null;
    let handleNewMessage: ((msg: Message) => void) | null = null;
    import('../services/socket').then(SocketService => {
      // Listen for correct event for online users
      handleOnlineUsers = (users: User[]) => {
        if (isMounted) setOnlineUsers(users);
      };
      handleNewMessage = (msg: Message) => {
        if (!isMounted) return;
        const currentRoom = currentRoomRef.current;
        const privateChat = privateChatRef.current;
        const userId = userIdRef.current;
        // Only add messages relevant to the current context
        let isForCurrentChat = false;
        if (!privateChat && msg.room === currentRoom && !msg.isPrivate) {
          setMessages(prev => [...prev, msg]);
          isForCurrentChat = true;
        } else if (
          privateChat && msg.isPrivate &&
          ((msg.userId === userId && msg.recipientId === privateChat) ||
           (msg.userId === privateChat && msg.recipientId === userId))
        ) {
          setMessages(prev => [...prev, msg]);
          isForCurrentChat = true;
        }
        // If not for current chat and not sent by self, increment unread
        if (!isForCurrentChat && msg.userId !== userId) {
          setUnreadCounts(prev => {
            const updated = { ...prev };
            if (msg.isPrivate && msg.recipientId === userId) {
              updated.privateChats = { ...updated.privateChats, [msg.userId]: (updated.privateChats[msg.userId] || 0) + 1 };
            } else if (!msg.isPrivate && msg.room) {
              updated.rooms = { ...updated.rooms, [msg.room]: (updated.rooms[msg.room] || 0) + 1 };
            }
            localStorage.setItem('unreadCounts', JSON.stringify(updated));
            return updated;
          });
          // No notification logic for new room messages; only badges are used
        }
      };
      SocketService.default.on('online_users_updated', handleOnlineUsers);
      SocketService.default.on('new_message', handleNewMessage);
      // Listen for private_chat_left event
      SocketService.default.on('private_chat_left', (data: { userId: string; nickname: string }) => {
        const privateChat = privateChatRef.current;
        if (privateChat && data.userId === privateChat) {
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            userId: 'system',
            nickname: 'System',
            content: `User "${data.nickname}" left the chat.`,
            timestamp: new Date(),
            type: 'text',
            isPrivate: true,
            recipientId: userIdRef.current,
            room: undefined,
            isRead: true
          }]);
        }
      });
      // Listen for private_chat_removed event
      SocketService.default.on('private_chat_removed', (data: { userId: string; otherUserId: string }) => {
        const privateChat = privateChatRef.current;
        if (privateChat && (privateChat === data.userId || privateChat === data.otherUserId)) {
          setPrivateChat(null);
          setMessages([]);
          localStorage.removeItem('privateChat');
        }
      });
    });
    // Clean up on unmount
    return () => {
      isMounted = false;
      import('../services/socket').then(SocketService => {
        if (handleOnlineUsers) SocketService.default.off('onlineUsers', handleOnlineUsers);
        if (handleNewMessage) SocketService.default.off('new_message', handleNewMessage);
      });
    };
  }, [user.id]);

  // Join/leave public rooms as needed
  const prevRoomRef = useRef<string | null>(null);
  useEffect(() => {
    import('../services/socket').then(SocketService => {
      if (!privateChat && currentRoom) {
        if (prevRoomRef.current && prevRoomRef.current !== currentRoom) {
          SocketService.default.emit('leave_room', prevRoomRef.current);
        }
        SocketService.default.emit('join_room', currentRoom);
        prevRoomRef.current = currentRoom;
      } else if (prevRoomRef.current) {
        SocketService.default.emit('leave_room', prevRoomRef.current);
        prevRoomRef.current = null;
      }
    });
  }, [currentRoom, privateChat]);

  // Reset unread count for room only when entering a new room (not on reload)
  const prevRoomForUnreadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!privateChat && currentRoom && prevRoomForUnreadRef.current !== currentRoom) {
      setUnreadCounts(prev => {
        if (prev.rooms[currentRoom] > 0) {
          const updated = { ...prev, rooms: { ...prev.rooms, [currentRoom]: 0 } };
          localStorage.setItem('unreadCounts', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
      prevRoomForUnreadRef.current = currentRoom;
    }
  }, [currentRoom, privateChat]);

  // Always reset messages state when context changes (room/privateChat)
  // Notify backend of private chat session join/leave
  const prevPrivateChatRef = useRef<string | null>(null);
  useEffect(() => {
    import('../services/socket').then(SocketService => {
      if (privateChat) {
        SocketService.default.emit('join_private_chat', privateChat);
        prevPrivateChatRef.current = privateChat;
      } else {
        prevPrivateChatRef.current = null;
      }
    });
  }, [privateChat]);

  // Explicit leave handler for private chat
  const leavePrivateChat = () => {
    import('../services/socket').then(SocketService => {
      if (privateChat) {
        SocketService.default.emit('leave_private_chat', privateChat);
        setPrivateChat(null);
        setCurrentRoom('public');
        setMessages([]);
        localStorage.removeItem('privateChat');
        localStorage.setItem('currentRoom', 'public');
      }
    });
  };

  useEffect(() => {
    setMessages([]); // Clear messages state on context change
    import('../services/api').then(({ messageAPI }) => {
      if (privateChat) {
        messageAPI.getPrivateMessages(privateChat).then(res => {
          if (res.data && Array.isArray(res.data.messages)) {
            setMessages(res.data.messages);
          }
        });
      } else if (currentRoom) {
        messageAPI.getRoomMessages(currentRoom).then(res => {
          if (res.data && Array.isArray(res.data.messages)) {
            setMessages(res.data.messages);
          }
        });
      }
    });
    // Always scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentRoom, privateChat]);

  // Mark messages as read when viewing a room or private chat
  useEffect(() => {
    if (privateChat) {
      setUnreadCounts(prev => {
        const updated = {
          ...prev,
          privateChats: {
            ...prev.privateChats,
            [privateChat]: 0
          }
        };
        localStorage.setItem('unreadCounts', JSON.stringify(updated));
        return updated;
      });
    } else if (currentRoom) {
      setUnreadCounts(prev => {
        const updated = {
          ...prev,
          rooms: {
            ...prev.rooms,
            [currentRoom]: 0
          }
        };
        localStorage.setItem('unreadCounts', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentRoom, privateChat]);

  const addMessage = (content: string, type: 'text' | 'image' = 'text') => {
    import('../services/socket').then(SocketService => {
      SocketService.default.emit('send_message', {
        content,
        type,
        roomId: privateChat ? undefined : currentRoom,
        isPrivate: !!privateChat,
        recipientId: privateChat || undefined,
      });
    });
  };

  // After backend integration, messages state is always current for the active chat/room
  const getCurrentMessages = () => messages;

  const startPrivateChat = (targetUserId: string) => {
    setPrivateChat(targetUserId);
    setCurrentRoom('');
    localStorage.setItem('privateChat', targetUserId);
    localStorage.setItem('currentRoom', '');
  };

  const handleRoomChange = (roomId: string) => {
    setCurrentRoom(roomId);
    setPrivateChat(null);
    localStorage.setItem('currentRoom', roomId);
    localStorage.removeItem('privateChat');
  };

  const getCurrentTitle = () => {
    if (privateChat) {
      const targetUser = onlineUsers.find(u => u.id === privateChat);
      return targetUser?.nickname || 'Unknown';
    }
    const room = rooms.find(r => r.id === currentRoom);
    return room?.name || 'LankaAdsPrivate';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-rose-200 animate-fade-in">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-rose-200 p-4 shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex-shrink-0 p-2 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 border border-rose-200 shadow-sm relative"
              >
                <Menu className="h-5 w-5 text-rose-600" />
                {(Object.values(unreadCounts.rooms).reduce((a, b) => a + b, 0) + 
                  Object.values(unreadCounts.privateChats).reduce((a, b) => a + b, 0)) > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </Button>
            )}
            
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent truncate animate-scale-in">
              {privateChat ? `Chat with ${getCurrentTitle()}` : getCurrentTitle()}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {privateChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={leavePrivateChat}
                className="border-rose-300 text-rose-600 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 shadow-sm hidden sm:inline-flex"
              >
                Leave Private Chat
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-rose-300 text-rose-600 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Leave Chatroom</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Private Chat Leave Button */}
        {isMobile && privateChat && (
          <div className="mt-3 flex justify-end animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={leavePrivateChat}
              className="border-rose-300 text-rose-600 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              Leave Private Chat
            </Button>
          </div>
        )}
        
        {/* Top-level unseen message notification for common rooms */}
        <div className="absolute right-4 top-4 flex items-center space-x-2">
          {Object.values(unreadCounts.rooms).reduce((a, b) => a + b, 0) > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
              {Object.values(unreadCounts.rooms).reduce((a, b) => a + b, 0)} new room message{Object.values(unreadCounts.rooms).reduce((a, b) => a + b, 0) > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Always render for desktop, conditionally for mobile */}
        {(!isMobile || sidebarOpen) && (
          <div className={`${isMobile ? 'fixed inset-0 z-50 bg-black/20 animate-fade-in' : ''}`}>
            {isMobile && (
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div className={`${isMobile ? 'animate-slide-in-right' : ''}`}>
              <Sidebar
                rooms={rooms}
                currentRoom={currentRoom}
                onRoomChange={handleRoomChange}
                onlineUsers={onlineUsers.map(u => ({ ...u, lastActive: new Date(u.lastActive) }))}
                currentUser={{ ...user, lastActive: new Date(user.lastActive) }}
                onStartPrivateChat={startPrivateChat}
                privateChat={privateChat}
                isMobile={isMobile}
                onClose={() => setSidebarOpen(false)}
                unreadCounts={unreadCounts}
              />
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {(!isMobile || !sidebarOpen) && (
          <div className="flex-1 animate-fade-in">
            <ChatInterface
              messages={messages}
              onSendMessage={addMessage}
              currentUser={user}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
