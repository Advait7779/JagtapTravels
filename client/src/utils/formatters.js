export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
export const formatCurrency = formatINR;
export const localDate = (offset = 0) => {
  const now = new Date();
  const india = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const date = new Date(india + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
export const dateInput = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
};
export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00Z' : value);
  return Number.isNaN(d.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
};
export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** Convert a number to Indian currency words (Lakhs/Crores system). */
export const numberToWordsIndian = (num) => {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return 'ZERO Rupees only';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN',
    'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const twoDigit = (v) => {
    if (v === 0) return '';
    if (v < 20) return ones[v];
    return tens[Math.floor(v / 10)] + (v % 10 ? ' ' + ones[v % 10] : '');
  };
  const threeDigit = (v) => {
    if (v === 0) return '';
    const h = Math.floor(v / 100);
    const r = v % 100;
    return (h ? ones[h] + ' HUNDRED' : '') + (h && r ? ' ' : '') + twoDigit(r);
  };
  const parts = [];
  const crores = Math.floor(n / 10000000);
  const lakhs = Math.floor((n % 10000000) / 100000);
  const thousands = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crores) parts.push(twoDigit(crores) + ' CRORE');
  if (lakhs) parts.push(twoDigit(lakhs) + ' LAKH');
  if (thousands) parts.push(twoDigit(thousands) + ' THOUSAND');
  if (rest) parts.push(threeDigit(rest));
  return parts.join(' ') + ' Rupees only';
};
