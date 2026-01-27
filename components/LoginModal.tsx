import React, { useState } from 'react';
import { X, User, Lock, LogIn, Loader2, Cloud } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user;
      if (isSignUp) {
        user = await supabaseService.signUp(email, password);
        alert('註冊成功！請檢查 Emal 驗證信 (如果 Supabase 開啟了驗證)');
      } else {
        user = await supabaseService.login(email, password);
      }
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || (isSignUp ? '註冊失敗' : '登入失敗'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
        <div className="bg-brand-600 p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Cloud size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold">雲端同步{isSignUp ? '註冊' : '登入'}</h2>
          <p className="text-brand-100 text-sm mt-1">
            {isSignUp ? '建立新帳號以開始同步' : '登入後即可在多裝置間同步資料'}
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入 Email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">密碼</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <LogIn size={20} /> {isSignUp ? '註冊帳號' : '登入'}
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline"
            >
              {isSignUp ? '已有帳號？點此登入' : '還沒有帳號？免費註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};