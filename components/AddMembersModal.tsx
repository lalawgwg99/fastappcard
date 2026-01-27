import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { X, Sparkles, Loader2, Plus, ArrowRight, ShieldCheck, Save } from 'lucide-react';
import { parseMembersFromText } from '../services/geminiService';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (members: Omit<Member, 'id' | 'createdAt'>[]) => void;
  existingPhoneNumbers?: Set<string>;
  initialData?: Member | null;
  onEditSave?: (updatedData: Partial<Member>) => void;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddMembers,
  existingPhoneNumbers = new Set(),
  initialData,
  onEditSave
}) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BATCH'>('BATCH');
  const [batchText, setBatchText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(true);

  // Single form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Effect to handle "Edit Mode" or reset
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit Mode
        setActiveTab('SINGLE'); // Force single tab
        setName(initialData.name);
        setPhone(initialData.phone);
        setNote(initialData.note || '');
        setFilterDuplicates(false); // Usually disable duplicate check when editing self
      } else {
        // Add Mode
        setName('');
        setPhone('');
        setNote('');
        // Default to batch if empty, or keep previous pref? 
        // For simplicity let's keep user's flow or default to Batch for power users
        if (activeTab === 'SINGLE') {
             // keep single
        } else {
             setActiveTab('BATCH');
        }
        setFilterDuplicates(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleBatchSubmit = async () => {
    if (!batchText.trim()) return;
    setIsProcessing(true);
    const parsed = await parseMembersFromText(batchText);
    
    if (parsed.length > 0) {
      const newMembers: Omit<Member, 'id' | 'createdAt'>[] = [];
      const processedPhones = new Set<string>();
      let duplicateCount = 0;

      for (const p of parsed) {
        const phoneKey = p.phone.trim();

        // Duplicate Check Logic
        if (filterDuplicates) {
            // Check 1: Is it already in the app?
            if (existingPhoneNumbers.has(phoneKey)) {
                duplicateCount++;
                continue;
            }
            // Check 2: Is it already in THIS batch?
            if (processedPhones.has(phoneKey)) {
                duplicateCount++;
                continue;
            }
        }
        
        processedPhones.add(phoneKey);
        newMembers.push({
          name: p.name,
          phone: p.phone,
          isUsed: false,
          voucherType: 'NONE' as const,
          isVip: false,
          birthdayMonth: p.birthdayMonth || '',
          note: p.note || ''
        });
      }

      if (newMembers.length > 0) {
        onAddMembers(newMembers);
        setBatchText('');
        
        let msg = `成功新增 ${newMembers.length} 筆資料`;
        if (duplicateCount > 0) {
            msg += `\n(已自動排除 ${duplicateCount} 筆重複號碼)`;
        }
        alert(msg);
        onClose();
      } else if (duplicateCount > 0) {
         alert(`所有資料 (${duplicateCount} 筆) 皆為重複號碼，未新增任何資料。`);
      } else {
         alert("無法解析有效資料，請確認格式。");
      }
    } else {
      alert("無法解析文字，請確認格式是否正確 (姓名 電話)");
    }
    setIsProcessing(false);
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialData && onEditSave) {
        // Edit Mode Save
        // We only check duplicates if the phone number CHANGED and filter is on
        if (filterDuplicates && phone !== initialData.phone && existingPhoneNumbers.has(phone)) {
             alert('此電話號碼已存在於其他會員資料中！');
             return;
        }

        onEditSave({
            name,
            phone,
            note
        });
        // onEditSave handles closing
    } else {
        // Add Mode Save
        if (filterDuplicates && existingPhoneNumbers.has(phone)) {
            alert('此電話號碼已存在！');
            return;
        }

        onAddMembers([{
          name,
          phone,
          isUsed: false,
          voucherType: 'NONE',
          isVip: false,
          birthdayMonth: '',
          note: note
        }]);
        
        setName('');
        setPhone('');
        setNote('');
        // Optional: keep open for rapid entry? Or close. 
        // User behavior usually prefers close.
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl h-[85vh] sm:h-auto flex flex-col shadow-2xl animate-slide-up sm:animate-fade-in rounded-t-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
             {initialData ? '修改資料' : '新增資料'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs - Only show if NOT editing */}
        {!initialData && (
            <div className="flex p-2 gap-2 bg-gray-50 border-b">
            <button
                onClick={() => setActiveTab('BATCH')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'BATCH' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}
            >
                <span className="flex items-center justify-center gap-1">
                <Sparkles size={14} /> AI 批量貼上
                </span>
            </button>
            <button
                onClick={() => setActiveTab('SINGLE')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'SINGLE' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}
            >
                單筆輸入
            </button>
            </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'BATCH' && !initialData ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p>直接貼上整串名單，AI 會自動幫你整理！</p>
                <p className="opacity-70 text-xs mt-1">支援格式：王小明 0912345678 (04/20)</p>
              </div>
              
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="貼上你的清單..."
                className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-sm leading-relaxed"
              />

              <div className="flex items-center gap-2 pb-2">
                 <input 
                    type="checkbox" 
                    id="filterDup" 
                    checked={filterDuplicates} 
                    onChange={e => setFilterDuplicates(e.target.checked)}
                    className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                 />
                 <label htmlFor="filterDup" className="text-sm text-gray-700 font-medium flex items-center gap-1">
                    <ShieldCheck size={16} className="text-green-600"/>
                    排除重複號碼 (包含已存在的)
                 </label>
              </div>

              <button
                onClick={handleBatchSubmit}
                disabled={isProcessing || !batchText.trim()}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <>開始解析 <ArrowRight size={20} /></>}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="輸入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                <input
                  required
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                  placeholder="輸入電話"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註 (選填)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="例如：需確認身分、特別需求..."
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                 <input 
                    type="checkbox" 
                    id="filterDupSingle" 
                    checked={filterDuplicates} 
                    onChange={e => setFilterDuplicates(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                 />
                 <label htmlFor="filterDupSingle" className="text-sm text-gray-600">
                    檢查重複號碼
                 </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 mt-6"
              >
                {initialData ? (
                    <><Save size={20} className="inline mr-1" /> 儲存修改</>
                ) : (
                    <><Plus size={20} className="inline mr-1" /> 新增</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};