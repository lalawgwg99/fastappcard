export const VoucherType = {
  NONE: 'NONE',
  ELECTRONIC: 'ELECTRONIC',
  PAPER: 'PAPER'
} as const;

export type VoucherType = typeof VoucherType[keyof typeof VoucherType];

export const VoucherTypeLabels: Record<VoucherType, string> = {
  [VoucherType.NONE]: '無',
  [VoucherType.ELECTRONIC]: '電子票券',
  [VoucherType.PAPER]: '紙本票券'
};

export const VoucherTypeColors: Record<VoucherType, string> = {
  [VoucherType.NONE]: 'border-gray-200 text-gray-600 bg-gray-50',
  [VoucherType.ELECTRONIC]: 'border-purple-200 text-purple-700 bg-purple-50',
  [VoucherType.PAPER]: 'border-amber-200 text-amber-700 bg-amber-50'
};

export interface Voucher {
  id: string;
  title: string;
  code: string;
  type: VoucherType;
  notes: string;
  isUsed: boolean;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  isUsed: boolean;
  voucherType: VoucherType;
  isVip: boolean;
  birthdayMonth: string; // "1" ~ "12" or ""
  note: string;
  createdAt: number;
}

export interface User {
  username: string;
  token: string; // In a real app, this would be a JWT
}