
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Home, MessageCircle, X, Menu, ChevronRight, Bell } from 'lucide-react';

interface User {
  id: string;
  nickname: string;
  gender: 'male' | 'female' | 'couple';
  lastActive: Date;
}

interface Room {
  id: string;
  name: string;
  icon: any;
}

interface UnreadCounts {
  rooms: { [roomId: string]: number };
  privateChats: { [userId: string]: number };
}

interface SidebarProps {
  rooms: Room[];
  currentRoom: string;
  onRoomChange: (roomId: string) => void;
  onlineUsers: User[];
  currentUser: User;
  onStartPrivateChat: (userId: string) => void;
  privateChat: string | null;
  isMobile: boolean;
  onClose?: () => void;
  unreadCounts: UnreadCounts;
}

const Sidebar = ({
  rooms,
  currentRoom,
  onRoomChange,
  onlineUsers,
  currentUser,
  onStartPrivateChat,
  privateChat,
  isMobile,
  onClose,
  unreadCounts
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [isExpanded, setIsExpanded] = useState(true);

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      case 'couple': return '💑';
      default: return '👤';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-800';
      case 'female': return 'bg-pink-100 text-pink-800';
      case 'couple': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalUnreadPrivateMessages = () => {
    return Object.values(unreadCounts.privateChats).reduce((sum, count) => sum + count, 0);
  };

  const getTotalUnreadRoomMessages = () => {
    return Object.values(unreadCounts.rooms).reduce((sum, count) => sum + count, 0);
  };

  // Collapsed sidebar view for desktop
  if (!isMobile && !isExpanded) {
    return (
      <div className="fixed left-4 top-20 z-50 space-y-3">
        {/* Expand button */}
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 animate-pulse"
          size="lg"
        >
          <Menu className="h-5 w-5 mr-2" />
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Quick access buttons */}
        <Button
          onClick={() => {
            setIsExpanded(true);
            setActiveTab('rooms');
          }}
          className="bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg backdrop-blur-sm border-white/20 border transition-all duration-300 hover:scale-110 relative"
          size="sm"
        >
          <Home className="h-4 w-4" />
          {getTotalUnreadRoomMessages() > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center animate-pulse">
              {getTotalUnreadRoomMessages()}
            </Badge>
          )}
        </Button>
        
        <Button
          onClick={() => {
            setIsExpanded(true);
            setActiveTab('users');
          }}
          className="bg-pink-500/90 hover:bg-pink-600 text-white shadow-lg backdrop-blur-sm border-white/20 border relative transition-all duration-300 hover:scale-110"
          size="sm"
        >
          <Users className="h-4 w-4" />
          <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center animate-pulse">
            {onlineUsers.length}
          </Badge>
          {getTotalUnreadPrivateMessages() > 0 && (
            <Badge className="absolute -top-4 -right-2 bg-red-500 text-white text-xs h-4 w-4 p-0 flex items-center justify-center animate-bounce">
              <Bell className="h-2 w-2" />
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={`${isMobile ? 'w-full max-w-sm ml-auto' : 'w-80'} h-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-none relative animate-scale-in`}>
      <div className="p-4 border-b border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            Navigation
          </h2>
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(false)}
                className="hover:bg-rose-100 transition-all duration-300 hover:scale-105"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
            )}
            {isMobile && onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="hover:bg-rose-100 transition-all duration-300 hover:scale-105"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-80px)]">
        <TabsList className="grid w-full grid-cols-2 m-4 bg-gradient-to-r from-rose-100 to-pink-100 shadow-sm">
          <TabsTrigger 
            value="rooms" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300 hover:scale-105 relative"
          >
            <Home className="h-4 w-4 mr-2" />
            Rooms
            {getTotalUnreadRoomMessages() > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs animate-pulse">
                {getTotalUnreadRoomMessages()}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white relative transition-all duration-300 hover:scale-105"
          >
            <Users className="h-4 w-4 mr-2" />
            Users
            <Badge className="ml-2 bg-green-500 text-white text-xs animate-pulse">
              {onlineUsers.length}
            </Badge>
            {getTotalUnreadPrivateMessages() > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs animate-bounce">
                <Bell className="h-3 w-3" />
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="px-4 animate-fade-in">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-4">
              {rooms.map((room, index) => (
                <Button
                  key={room.id}
                  variant={currentRoom === room.id && !privateChat ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 hover:scale-105 shadow-sm relative ${
                    currentRoom === room.id && !privateChat
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                      : 'hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 text-gray-700'
                  }`}
                  onClick={() => {
                    onRoomChange(room.id);
                    if (isMobile && onClose) onClose();
                  }}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <room.icon className="h-4 w-4 mr-3" />
                  {room.name}
                  {unreadCounts.rooms[room.id] > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs animate-pulse">
                      {unreadCounts.rooms[room.id]}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="users" className="px-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Online Users</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse">
              {onlineUsers.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-2 pr-4">
              {onlineUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border transition-all duration-300 hover:scale-105 shadow-sm animate-fade-in relative ${
                    user.id === currentUser.id
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200'
                      : 'bg-white border-gray-200 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:border-rose-200 cursor-pointer hover:shadow-lg'
                  }`}
                  onClick={() => {
                    if (user.id !== currentUser.id) {
                      onStartPrivateChat(user.id);
                      if (isMobile && onClose) onClose();
                    }
                  }}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg transition-transform duration-300 hover:scale-110">
                        {getGenderIcon(user.gender)}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">
                          {user.nickname}
                          {user.id === currentUser.id && ' (You)'}
                        </div>
                        <Badge className={`text-xs transition-all duration-300 hover:scale-105 ${getGenderColor(user.gender)}`}>
                          {user.gender}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.id !== currentUser.id && (
                        <MessageCircle className="h-4 w-4 text-gray-400 transition-all duration-300 hover:text-rose-500 hover:scale-110" />
                      )}
                      {unreadCounts.privateChats[user.id] > 0 && (
                        <Badge className="bg-red-500 text-white text-xs animate-bounce">
                          {unreadCounts.privateChats[user.id]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default Sidebar;
