import React, { useState, useEffect } from 'react';
import { Voucher, VoucherType, VoucherTypeLabels } from '../types';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { parseVoucherFromText } from '../services/geminiService';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Omit<Voucher, 'id' | 'createdAt'>) => void;
  initialData?: Voucher;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<VoucherType>(VoucherType.ELECTRONIC);
  const [notes, setNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [smartInput, setSmartInput] = useState(''); // Text area for AI paste

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setCode(initialData.code);
        setType(initialData.type);
        setNotes(initialData.notes);
        setSmartInput('');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setTitle('');
    setCode('');
    setType(VoucherType.ELECTRONIC);
    setNotes('');
    setSmartInput('');
  };

  const handleSmartParse = async () => {
    if (!smartInput.trim()) return;
    setIsAiLoading(true);
    const result = await parseVoucherFromText(smartInput);
    if (result) {
      setTitle(result.title);
      setCode(result.code || '');
      setType(result.type);
      setNotes(result.notes || '');
    }
    setIsAiLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      code,
      type,
      notes,
      isUsed: initialData ? initialData.isUsed : false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? '編輯資料' : '新增資料'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          
          {/* AI Smart Input Section */}
          {!initialData && (
            <div className="bg-brand-50 p-3 rounded-xl border border-brand-100">
              <label className="text-sm font-semibold text-brand-900 flex items-center gap-1 mb-2">
                <Sparkles size={16} className="text-brand-600" />
                AI 智慧貼上 (選填)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="貼上簡訊或LINE內容..."
                  className="flex-1 text-sm p-2 border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                />
                <button 
                  onClick={handleSmartParse}
                  disabled={isAiLoading || !smartInput}
                  className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center"
                >
                  {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : '解析'}
                </button>
              </div>
            </div>
          )}

          <form id="voucherForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題/店名 *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：全家霜淇淋、星巴克會員"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">條碼/號碼</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="輸入會員電話或優惠代碼"
                className="w-full p-3 border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">類型 (結帳方式)</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VoucherTypeLabels) as VoucherType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2 text-sm rounded-lg border text-left transition-all ${
                      type === t 
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {VoucherTypeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備註 (選填)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：需出示身分證、期限到12/31"
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            type="submit"
            form="voucherForm"
            className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
          >
            {initialData ? '儲存修改' : '新增'}
          </button>
        </div>
      </div>
    </div>
  );
};