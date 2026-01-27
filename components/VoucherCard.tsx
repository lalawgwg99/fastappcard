import React from 'react';
import { Voucher, VoucherType, VoucherTypeColors, VoucherTypeLabels } from '../types';
import { CheckCircle, Circle, Trash2, Edit2, Copy } from 'lucide-react';

interface VoucherCardProps {
  voucher: Voucher;
  onToggleUse: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (voucher: Voucher) => void;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({ voucher, onToggleUse, onDelete, onEdit }) => {
  const handleCopy = () => {
    if (voucher.code) {
      navigator.clipboard.writeText(voucher.code);
      // Optional: Add a toast notification here
      alert(`已複製: ${voucher.code}`);
    }
  };

  return (
    <div className={`relative bg-white rounded-xl shadow-sm border ${voucher.isUsed ? 'border-gray-200 opacity-60' : 'border-gray-200'} p-4 mb-3 transition-all duration-200`}>
      {/* Header: Type and Status */}
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${VoucherTypeColors[voucher.type]}`}>
          {VoucherTypeLabels[voucher.type]}
        </span>
        <button 
          onClick={() => onToggleUse(voucher.id)}
          className={`flex items-center gap-1 text-sm font-medium ${voucher.isUsed ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {voucher.isUsed ? (
            <>
              <CheckCircle size={18} />
              <span>已使用</span>
            </>
          ) : (
            <>
              <Circle size={18} />
              <span>標記使用</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <h3 className={`text-lg font-bold text-gray-800 mb-1 ${voucher.isUsed ? 'line-through text-gray-500' : ''}`}>
          {voucher.title}
        </h3>
        
        {voucher.code && (
          <div 
            onClick={handleCopy}
            className="bg-gray-50 active:bg-gray-100 border border-dashed border-gray-300 rounded-lg p-2 flex justify-between items-center cursor-pointer mt-2"
          >
            <span className="font-mono text-xl font-bold text-gray-700 tracking-wider truncate">
              {voucher.code}
            </span>
            <Copy size={16} className="text-gray-400 flex-shrink-0 ml-2" />
          </div>
        )}

        {voucher.notes && (
          <p className="text-sm text-gray-500 mt-2 bg-yellow-50 p-2 rounded border border-yellow-100">
            💡 {voucher.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 mt-2">
        <button 
          onClick={() => onEdit(voucher)}
          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
          aria-label="編輯"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => onDelete(voucher.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          aria-label="刪除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};