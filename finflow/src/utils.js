// ===== FinFlow utilities =====

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** 'YYYY-MM' key for a Date or ISO date string */
export const monthKey = (d = new Date()) => {
  const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (n, currency = '$') => {
  const v = Number(n) || 0;
  const abs = Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${v < 0 ? '-' : ''}${currency}${abs}`;
};

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/** Last n month keys ending at current month, oldest first */
export const lastMonths = (n) => {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
};

/** Next due date for a bill given dueDay + frequency, relative to today. */
export const nextDueDate = (bill) => {
  const now = new Date();
  const day = Math.min(Number(bill.dueDay) || 1, 28);
  if (bill.frequency === 'weekly') {
    const d = new Date(now);
    const target = (Number(bill.dueDay) || 1) % 7; // 0=Sun
    const diff = (target - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  // monthly / yearly treated as day-of-month; if passed this month, roll forward
  let d = new Date(now.getFullYear(), now.getMonth(), day);
  if (bill.frequency === 'yearly' && bill.dueMonth != null) {
    d = new Date(now.getFullYear(), Number(bill.dueMonth), day);
    if (d < now) d = new Date(now.getFullYear() + 1, Number(bill.dueMonth), day);
    return d;
  }
  if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    d = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  return d;
};

export const daysUntil = (date) => {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - a) / 86400000);
};

/** Download rows (array of objects) as CSV */
export const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  triggerDownload(blob, filename);
};

export const downloadJSON = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Compress an image File to a small base64 data URL for receipt storage */
export const fileToDataURL = (file, maxDim = 900, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
