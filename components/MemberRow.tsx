import React, { useState } from 'react';
import { Member } from '../types';
import { Phone, Copy, Check, Crown, Smartphone, StickyNote, Cake, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';

interface MemberRowProps {
  member: Member;
  onUpdate: (id: string, updates: Partial<Member>) => void;
  onDelete: (id: string) => void;
  onEdit: (member: Member) => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, onUpdate, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(member.phone);
    // Could add toast here
  };

  const toggleUsed = () => onUpdate(member.id, { isUsed: !member.isUsed });
  const toggleVip = () => onUpdate(member.id, { isVip: !member.isVip });
  const setType = (type: Member['voucherType']) => onUpdate(member.id, { voucherType: type });
  const setBirthday = (month: string) => onUpdate(member.id, { birthdayMonth: month });

  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  return (
    <div className={`bg-white border-b border-gray-100 last:border-0 transition-all ${member.isUsed ? 'bg-red-50' : ''}`}>
      {/* Main Row Content - Click to Expand */}
      <div 
        onClick={() => {
            setIsExpanded(!isExpanded);
            setShowConfirmDelete(false); // Reset delete state when toggling
        }}
        className="p-4 cursor-pointer active:bg-gray-50"
      >
        <div className="flex items-center justify-between gap-2">
          
          {/* Left Side: Name and Phone */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-bold truncate ${member.isUsed ? 'text-red-800' : 'text-gray-900'}`}>
                {member.name}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xl tracking-wide ${member.isUsed ? 'text-red-800 font-bold' : 'text-blue-700 font-bold'}`}>
                {member.phone}
              </span>
              <button 
                onClick={handleCopyPhone}
                className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full"
              >
                <Copy size={16} />
              </button>
            </div>
            {member.note && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{member.note}</p>
            )}
          </div>

          {/* Right Side: Text Badges (Utilizing whitespace) */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {member.isUsed ? (
               <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-md flex items-center gap-1">
                 <Check size={12} /> 已使用
               </span>
            ) : (
              <>
                {/* VIP Badge */}
                {member.isVip && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md flex items-center gap-1 border border-yellow-200">
                    <Crown size={12} className="fill-yellow-600" /> VIP
                  </span>
                )}

                {/* Type Badge */}
                {member.voucherType === 'ELECTRONIC' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md border border-purple-200">
                    電子卷
                  </span>
                )}
                {member.voucherType === 'PAPER' && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md border border-amber-200">
                    紙本卷
                  </span>
                )}

                {/* Birthday Badge */}
                {member.birthdayMonth && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs font-bold rounded-md border border-pink-200">
                    {member.birthdayMonth}月壽星
                  </span>
                )}
                
                {/* Fallback if nothing is selected yet */}
                {!member.isVip && member.voucherType === 'NONE' && !member.birthdayMonth && (
                    <span className="text-xs text-gray-300">設定狀態</span>
                )}
              </>
            )}
          </div>

          <div className="pl-1">
             {isExpanded ? <ChevronUp className="text-gray-300" size={20} /> : <ChevronDown className="text-gray-300" size={20} />}
          </div>
        </div>
      </div>

      {/* Expanded Quick Settings Panel */}
      {isExpanded && (
        <div className="bg-slate-50 p-4 border-t border-gray-100 shadow-inner animate-fade-in">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Toggle Used */}
            <button
              onClick={toggleUsed}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                member.isUsed 
                  ? 'bg-gray-600 text-white shadow-inner' 
                  : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:border-gray-300'
              }`}
            >
              <Check size={18} />
              {member.isUsed ? '取消已使用' : '標記已使用'}
            </button>

            {/* Toggle VIP */}
            <button
              onClick={toggleVip}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                member.isVip
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                  : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:border-gray-300'
              }`}
            >
              <Crown size={18} className={member.isVip ? "fill-yellow-600" : ""} />
              VIP 會員
            </button>
          </div>

          <div className="space-y-4">
            {/* Voucher Type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">票券類型</label>
              <div className="flex rounded-lg bg-gray-200 p-1">
                <button 
                  onClick={() => setType('NONE')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${member.voucherType === 'NONE' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  無
                </button>
                <button 
                  onClick={() => setType('ELECTRONIC')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${member.voucherType === 'ELECTRONIC' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Smartphone size={14} /> 電子卷
                </button>
                <button 
                  onClick={() => setType('PAPER')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${member.voucherType === 'PAPER' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <StickyNote size={14} /> 紙本卷
                </button>
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">生日月份</label>
              <div className="flex flex-wrap gap-2">
                {months.map(m => (
                  <button
                    key={m}
                    onClick={() => setBirthday(member.birthdayMonth === m ? '' : m)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all border ${
                      member.birthdayMonth === m
                        ? 'bg-pink-500 text-white border-pink-600 shadow-md transform scale-110'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Edit & Delete */}
            <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center">
               
               <button 
                 onClick={() => onEdit(member)}
                 className="text-brand-600 text-sm flex items-center gap-1 hover:text-brand-700 hover:bg-brand-50 py-2 px-2 rounded transition-colors font-medium"
               >
                 <Edit2 size={16} /> 修改資料
               </button>

               {showConfirmDelete ? (
                 <div className="flex gap-2 items-center animate-fade-in">
                    <span className="text-xs text-red-500 font-bold">確定要刪除嗎？</span>
                    <button 
                      onClick={() => setShowConfirmDelete(false)}
                      className="text-gray-500 text-sm py-1.5 px-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => onDelete(member.id)}
                      className="text-white text-sm py-1.5 px-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-bold flex items-center gap-1"
                    >
                      <Trash2 size={14} /> 是，刪除
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setShowConfirmDelete(true)}
                   className="text-gray-400 text-sm flex items-center gap-1 hover:text-red-500 hover:bg-red-50 py-2 px-2 rounded transition-colors"
                 >
                   <Trash2 size={14} /> 刪除此筆
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};