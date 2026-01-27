import React from 'react';
import { Member } from '../types';
import { MemberRow } from './MemberRow';
import { X, Gift } from 'lucide-react';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentMonth: string;
  onUpdate: (id: string, updates: Partial<Member>) => void;
  onDelete: (id: string) => void;
  onEdit: (member: Member) => void;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  isOpen,
  onClose,
  members,
  currentMonth,
  onUpdate,
  onDelete,
  onEdit,
}) => {
  if (!isOpen) return null;

  // Sort members: Active first, then Used
  const sortedMembers = [...members].sort((a, b) => {
      if (a.isUsed === b.isUsed) return 0;
      return a.isUsed ? 1 : -1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Decorative Background Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 pt-6 pb-6 text-white shrink-0 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 text-white/20">
                 <Gift size={120} />
             </div>
             <div className="relative z-10">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Gift className="animate-bounce-slow" /> 
                    {currentMonth} 月壽星專區
                </h2>
                <p className="text-pink-100 text-sm mt-1">
                    本月共有 {members.length} 位壽星
                </p>
             </div>
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-sm"
             >
                <X size={20} />
             </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {sortedMembers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <Gift size={48} className="mb-4 text-gray-300" />
              <p>這個月沒有壽星喔！</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
               {sortedMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};