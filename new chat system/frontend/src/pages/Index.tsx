
import { useState } from 'react';
import LoginPage from '../components/LoginPage';
import ChatRoom from '../components/ChatRoom';
import { authAPI } from '../services/api';
import SocketService from '../services/socket';

interface User {
  id: string;
  nickname: string;
  gender: 'male' | 'female' | 'couple';
  lastActive: string;
}

import { useEffect } from 'react';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (nickname: string, gender: 'male' | 'female' | 'couple') => {
    try {
      const res = await authAPI.guestLogin(nickname, gender);
      if (res.data && res.data.success) {
        const { user, token } = res.data;
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('authToken', token);
        SocketService.connect(token);
      }
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {}
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('authToken');
    SocketService.disconnect();
  };

  // Restore session if token exists
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !isLoggedIn) {
      (async () => {
        try {
          const res = await authAPI.getCurrentUser();
          if (res.data && res.data.user) {
            setCurrentUser(res.data.user);
            setIsLoggedIn(true);
            SocketService.connect(token);
          } else {
            localStorage.removeItem('authToken');
          }
        } catch {
          localStorage.removeItem('authToken');
        }
      })();
    }
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-rose-200">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <ChatRoom user={currentUser!} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
