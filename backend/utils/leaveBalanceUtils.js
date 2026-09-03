import { StaffLeaveBalance } from '../models/index.js';

const BALANCE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity'];

const quotaField = (type) => `${type.toLowerCase()}Quota`;
const usedField = (type) => `${type.toLowerCase()}Used`;

export const getBalanceYear = (date = new Date()) => new Date(date).getFullYear();

export async function getOrCreateLeaveBalance(staffMemberId, year = getBalanceYear()) {
  let balance = await StaffLeaveBalance.findOne({ staffMember: staffMemberId, year });
  if (!balance) {
    balance = await StaffLeaveBalance.create({ staffMember: staffMemberId, year });
  }
  return balance;
}

export function serializeLeaveBalance(balance) {
  if (!balance) return null;
  const plain = balance.toObject ? balance.toObject() : { ...balance };
  const types = BALANCE_TYPES.map((type) => {
    const quota = plain[quotaField(type)] ?? 0;
    const used = plain[usedField(type)] ?? 0;
    return {
      type,
      quota,
      used,
      remaining: Math.max(quota - used, 0),
    };
  });
  return {
    ...plain,
    balances: types,
  };
}

export async function getLeaveBalanceSummary(staffMemberId, year = getBalanceYear()) {
  const balance = await getOrCreateLeaveBalance(staffMemberId, year);
  return serializeLeaveBalance(balance);
}

export function getRemainingForType(balance, type) {
  if (!BALANCE_TYPES.includes(type)) return null;
  const quota = balance[quotaField(type)] ?? 0;
  const used = balance[usedField(type)] ?? 0;
  return Math.max(quota - used, 0);
}

export async function validateLeaveBalance(staffMemberId, type, days, year = getBalanceYear()) {
  if (!BALANCE_TYPES.includes(type)) return { ok: true };
  const balance = await getOrCreateLeaveBalance(staffMemberId, year);
  const remaining = getRemainingForType(balance, type);
  if (days > remaining) {
    return {
      ok: false,
      message: `Insufficient ${type} leave balance. Remaining: ${remaining} day(s), requested: ${days}`,
      remaining,
    };
  }
  return { ok: true, remaining };
}

export async function applyLeaveBalanceChange(staffMemberId, type, days, direction = 'deduct', year = getBalanceYear()) {
  if (!BALANCE_TYPES.includes(type) || days <= 0) return null;
  const balance = await getOrCreateLeaveBalance(staffMemberId, year);
  const field = usedField(type);
  const current = balance[field] ?? 0;
  balance[field] = direction === 'deduct'
    ? current + days
    : Math.max(current - days, 0);
  await balance.save();
  return balance;
}
