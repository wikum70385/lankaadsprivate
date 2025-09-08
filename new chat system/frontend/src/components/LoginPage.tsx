
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (nickname: string, gender: 'male' | 'female' | 'couple') => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'couple'>('male');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onLogin(nickname.trim(), gender);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <MessageCircle className="h-8 w-8 text-pink-500" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            LankaAdsPrivate
          </CardTitle>
          <p className="text-gray-600">Join the most intimate chat experience</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nickname</label>
              <Input
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => {
                  if (e.target.value.length <= 100) setNickname(e.target.value);
                }}
                maxLength={100}
                className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                required
                onPaste={e => {
                  const paste = e.clipboardData.getData('text');
                  if ((nickname.length + paste.length) > 100) {
                    e.preventDefault();
                    setNickname((nickname + paste).slice(0, 100));
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <Select value={gender} onValueChange={(value: 'male' | 'female' | 'couple') => setGender(value)}>
                <SelectTrigger className="border-rose-200 focus:border-rose-400 focus:ring-rose-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-rose-200">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="couple">Couple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Enter Chat Room
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
