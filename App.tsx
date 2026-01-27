import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Archive, Users, Trash2, Download, Upload, MoreHorizontal, Link as LinkIcon, Share2, Store, Gift, FileJson, Settings, UserCircle, LogOut, Cloud, CloudOff, HelpCircle } from 'lucide-react';
import { Member, User } from './types';
import { MemberRow } from './components/MemberRow';
import { AddMembersModal } from './components/AddMembersModal';
import { BirthdayModal } from './components/BirthdayModal';
import { LoginModal } from './components/LoginModal';
import { supabaseService } from './services/supabaseService';
import { supabase } from './services/supabaseClient';
import LZString from 'lz-string';

const STORAGE_KEY = 'checkout-swift-data-simple-v1';
const STORE_NAME_KEY = 'checkout-swift-store-name';

function App() {
  // User State
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // App Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [storeName, setStoreName] = useState('');

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Initialize: Check for User Session & Load Data
  useEffect(() => {
    const initApp = async () => {
      // Check Supabase session
      const currentUser = await supabaseService.getUser();

      if (currentUser) {
        // --- LOGGED IN MODE ---
        setUser(currentUser);
        await loadCloudData(currentUser);
      } else {
        // --- GUEST MODE (Local Storage) ---
        const savedMembers = localStorage.getItem(STORAGE_KEY);
        const savedStoreName = localStorage.getItem(STORE_NAME_KEY);
        if (savedMembers) {
          try {
            setMembers(JSON.parse(savedMembers));
          } catch (e) { console.error(e); }
        }
        if (savedStoreName) setStoreName(savedStoreName);
      }
    };
    initApp();

    // Listen for Auth Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const newUser = { username: session.user.email || 'User', token: session.access_token };
        setUser(newUser);
        setIsLoginModalOpen(false);
        await loadCloudData(newUser);
      } else if (event === 'SIGNED_OUT') {
        // Cleanup handled in handleLogout mostly, but this catches extra cases
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Helper: Load Cloud Data
  const loadCloudData = async (currentUser: User) => {
    setIsSyncing(true);
    try {
      const data = await supabaseService.fetchUserData(currentUser);
      setMembers(data.members || []);
      setStoreName(data.storeName || '');
    } catch (e) {
      console.error("Cloud fetch failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper: Save Data (Decides Cloud or Local based on User state)
  const persistData = async (currentMembers: Member[], currentStoreName: string) => {
    if (user) {
      // Save to Cloud (Debounced effect calls this)
      try {
        await supabaseService.saveUserData(user, { members: currentMembers, storeName: currentStoreName });
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    } else {
      // Save to Local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentMembers));
      localStorage.setItem(STORE_NAME_KEY, currentStoreName);
    }
  };

  // Effect: Watch data changes and persist
  useEffect(() => {
    // Only save if we have initialized
    const timeoutId = setTimeout(() => {
      persistData(members, storeName);
    }, 1000); // 1s Debounce for cloud saving
    return () => clearTimeout(timeoutId);
  }, [members, storeName, user]);


  // Handle Login (Triggered by Modal via Service now, so this callback mainly updates UI if needed)
  const handleLoginSuccess = async (loggedInUser: User) => {
    // Initial logic moved to onAuthStateChange, but we keep this for Modal close
    setIsLoginModalOpen(false);
  };

  // Handle Logout
  const handleLogout = async () => {
    if (confirm('確定要登出嗎？')) {
      await supabaseService.logout();
      setUser(null);

      // Revert to Local Guest Data
      const savedMembers = localStorage.getItem(STORAGE_KEY);
      const savedStoreName = localStorage.getItem(STORE_NAME_KEY);
      setMembers(savedMembers ? JSON.parse(savedMembers) : []);
      setStoreName(savedStoreName || '');
      setIsMenuOpen(false);
    }
  };

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Shared Link Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');
    if (sharedData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
        if (decompressed) {
          const json = JSON.parse(decompressed);
          let newMembers: Member[] = [];
          let newStoreName = '';
          if (Array.isArray(json)) newMembers = json;
          else if (json.members && Array.isArray(json.members)) {
            newMembers = json.members;
            newStoreName = json.storeName || '';
          }

          if (newMembers.length > 0) {
            setTimeout(() => {
              const msg = `偵測到分享連結！\n內含 ${newMembers.length} 筆資料。\n\n確定要匯入嗎？(將合併至目前列表)`;
              if (confirm(msg)) {
                // Merge instead of replace for better UX when logged in
                const newItems = newMembers.map(m => ({ ...m, id: generateId() }));
                setMembers(prev => [...newItems, ...prev]);
                if (newStoreName && !storeName) setStoreName(newStoreName);
                window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }, 500);
          }
        }
      } catch (e) {
        console.error('Failed to parse shared link', e);
      }
    }
  }, []);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleAddMembers = (newMembersData: Omit<Member, 'id' | 'createdAt'>[]) => {
    const newItems: Member[] = newMembersData.map(data => ({
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    }));
    setMembers(prev => [...newItems, ...prev]);
  };

  const handleUpdate = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleEditSave = (updatedData: Partial<Member>) => {
    if (editingMember) {
      handleUpdate(editingMember.id, updatedData);
      setEditingMember(null);
      setIsModalOpen(false);
    }
  };

  const triggerEdit = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('確定要清空所有資料嗎？')) {
      setMembers([]);
      setStoreName('');
    }
  };

  const handleExport = () => {
    const exportData = { storeName, members };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const safeName = storeName ? `-${storeName}` : '';
    link.href = url;
    link.download = `checkout-members${safeName}-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMenuOpen(false);
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let importMembers: any[] = [];
        let importStoreName = '';
        if (Array.isArray(json)) importMembers = json;
        else if (json.members && Array.isArray(json.members)) {
          importMembers = json.members;
          importStoreName = json.storeName || '';
        }
        if (importMembers.length > 0) {
          if (confirm(`確定要匯入 ${importMembers.length} 筆資料嗎？`)) {
            const processedMembers = importMembers.map((m: any) => ({
              ...m,
              id: m.id || generateId()
            }));
            setMembers(prev => [...processedMembers, ...prev]);
            if (importStoreName && !storeName) setStoreName(importStoreName);
          }
        } else { alert('檔案內容格式不符'); }
      } catch (err) { alert('檔案格式錯誤'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleShareLink = () => {
    try {
      if (members.length === 0) { alert('目前沒有資料可以分享'); return; }
      const payload = { storeName, members };
      const jsonStr = JSON.stringify(payload);
      const compressed = LZString.compressToEncodedURIComponent(jsonStr);
      const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
      if (url.length > 8000) { alert('資料量過大，建議使用「匯出檔案」功能來傳送。'); return; }
      navigator.clipboard.writeText(url).then(() => {
        alert('連結已複製！');
      }).catch(() => { prompt("請手動複製連結：", url); });
      setIsMenuOpen(false);
    } catch (e) { console.error(e); alert('產生連結失敗'); }
  };

  const filteredMembers = members.filter(m => {
    if (searchTerm) {
      return (
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm)
      );
    }
    return true;
  });

  const activeCount = members.filter(m => !m.isUsed).length;
  const existingPhoneNumbers = new Set(members.map(m => m.phone));
  const currentMonth = (new Date().getMonth() + 1).toString();
  const allBirthdayMembers = members.filter(m => m.birthdayMonth === currentMonth);
  const activeBirthdayCount = allBirthdayMembers.filter(m => !m.isUsed).length;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-lg bg-white min-h-screen shadow-2xl flex flex-col">

        {/* Header */}
        <div className="bg-brand-600 p-4 pb-2 text-white sticky top-0 z-20 shadow-md transition-all">

          {/* Top Bar: Title & Actions */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Users size={24} />
                會員資料
              </h1>
              <p className="text-brand-100 text-xs mt-1">
                剩餘 {activeCount} 筆 / 總共 {members.length} 筆
              </p>
            </div>

            <div className="flex items-center gap-2 relative" ref={menuRef}>

              {/* User Avatar / Login Button */}
              {user ? (
                <div className="flex items-center">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-9 h-9 bg-brand-800 rounded-full flex items-center justify-center text-white font-bold border-2 border-brand-400 hover:border-white transition-all shadow-sm"
                    title={`已登入：${user.username}`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </button>
                  {isSyncing && (
                    <span className="absolute top-0 right-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="p-2 bg-brand-500 hover:bg-brand-400 rounded-lg text-white transition-colors flex items-center gap-1 text-sm font-medium pr-3"
                >
                  <UserCircle size={18} /> 登入
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-6 bg-brand-500/50 mx-1"></div>

              {/* Birthday Button */}
              <button
                onClick={() => setIsBirthdayModalOpen(true)}
                className="relative p-2 bg-pink-500 hover:bg-pink-400 rounded-lg text-white transition-colors shadow-sm flex items-center justify-center"
                title={`${currentMonth}月壽星專區`}
              >
                <Gift size={18} />
                {activeBirthdayCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {activeBirthdayCount}
                  </span>
                )}
              </button>

              {/* Menu Button (Combined with User actions if logged in) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-lg text-white transition-colors shadow-sm flex items-center justify-center ${isMenuOpen ? 'bg-brand-500 ring-2 ring-white/30' : 'bg-brand-500 hover:bg-brand-400'}`}
              >
                <MoreHorizontal size={20} />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right transform transition-all duration-200">

                  {/* User Info Section in Menu */}
                  {user && (
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">目前帳號</p>
                      <p className="text-sm font-bold text-brand-900 truncate">{user.username}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <Cloud size={10} /> 雲端同步開啟中
                      </div>
                    </div>
                  )}

                  <div className="py-1">
                    <button
                      onClick={handleShareLink}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                    >
                      <LinkIcon size={18} className="text-green-500" />
                      <span>分享連結</span>
                    </button>

                    <div className="h-px bg-gray-100 mx-2 my-1"></div>

                    <button
                      onClick={handleExport}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                    >
                      <Download size={18} className="text-brand-600" />
                      <span>匯出備份</span>
                    </button>

                    <button
                      onClick={handleImportTrigger}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                    >
                      <Upload size={18} className="text-brand-600" />
                      <span>匯入檔案</span>
                    </button>

                    <div className="h-px bg-gray-100 mx-2 my-1"></div>
                    <button
                      onClick={() => alert("【使用說明】\n1. 新增會員：點擊右下角 + 號\n2. AI 辨識：貼上整串名單 (姓名 電話)\n3. 搜尋：利用上方搜尋列尋找會員\n4. 備份：透過選單匯出/匯入資料\n5. 雲端同步：登入後自動備份")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                    >
                      <HelpCircle size={18} className="text-blue-500" />
                      <span>使用說明</span>
                    </button>

                    {user && (
                      <>
                        <div className="h-px bg-gray-100 mx-2 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 font-medium transition-colors"
                        >
                          <LogOut size={18} />
                          <span>登出帳號</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Footer / Credits */}
                  <div className="bg-gray-50 p-3 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-mono">
                      Powered by 榮德
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                hidden
              />
            </div>
          </div>

          {/* Store Name Input */}
          <div className="relative mb-3 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Store className="text-brand-200" size={16} />
            </div>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder={user ? "此清單已同步至您的雲端帳號" : "在此輸入店名 (本機模式)"}
              className="block w-full pl-10 pr-3 py-1.5 border-none rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium transition-all"
            />
          </div>

          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-200" size={18} />
            <input
              type="text"
              placeholder="搜尋姓名或電話..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 border-none shadow-sm"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-end px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm">
          {(members.length > 0 || storeName) && (
            <button onClick={handleClearAll} className="text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors">
              <Trash2 size={14} /> 清空所有資料
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Search size={30} className="text-gray-400" />
              </div>
              <p>{searchTerm ? '找不到資料' : '沒有資料'}</p>
              <p className="text-xs mt-2 text-gray-400">
                {user ? '雲端資料庫目前是空的' : '請新增資料，或登入以讀取雲端存檔'}
              </p>
            </div>
          ) : (
            <div>
              {filteredMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onEdit={triggerEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* FAB */}
        <div className="fixed bottom-6 right-6 lg:absolute lg:bottom-6 lg:right-6 z-30">
          <button
            onClick={() => {
              setEditingMember(null);
              setIsModalOpen(true);
            }}
            className="w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-xl shadow-brand-600/40 flex items-center justify-center transition-transform active:scale-95"
          >
            <Plus size={32} />
          </button>
        </div>

        <AddMembersModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMember(null);
          }}
          onAddMembers={handleAddMembers}
          existingPhoneNumbers={existingPhoneNumbers}
          initialData={editingMember}
          onEditSave={handleEditSave}
        />

        <BirthdayModal
          isOpen={isBirthdayModalOpen}
          onClose={() => setIsBirthdayModalOpen(false)}
          members={allBirthdayMembers}
          currentMonth={currentMonth}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={triggerEdit}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

      </div>
    </div >
  );
}

export default App;