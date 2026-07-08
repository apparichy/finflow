import React from 'react';
import {
  Wallet, ShoppingCart, Pizza, UtensilsCrossed, Home, Zap, Droplets, Smartphone,
  Flame, Wifi, Music, Youtube, Clapperboard, Dumbbell, Shield, Car, Fuel, Gift,
  Sparkles, GraduationCap, Briefcase, Laptop, TrendingUp, Megaphone, Award,
  PiggyBank, Plane, CreditCard, Landmark, CircleDollarSign, HeartPulse,
  ShoppingBag, MoreHorizontal, X,
} from 'lucide-react';

/** Icon registry — string names stored in data, resolved here */
export const ICONS = {
  Wallet, ShoppingCart, Pizza, UtensilsCrossed, Home, Zap, Droplets, Smartphone,
  Flame, Wifi, Music, Youtube, Clapperboard, Dumbbell, Shield, Car, Fuel, Gift,
  Sparkles, GraduationCap, Briefcase, Laptop, TrendingUp, Megaphone, Award,
  PiggyBank, Plane, CreditCard, Landmark, CircleDollarSign, HeartPulse,
  ShoppingBag, MoreHorizontal,
};

export const ICON_SETS = {
  income: ['Briefcase', 'Laptop', 'TrendingUp', 'Megaphone', 'Award', 'CircleDollarSign', 'Gift'],
  expense: ['ShoppingCart', 'Pizza', 'UtensilsCrossed', 'Home', 'Car', 'Fuel', 'Gift', 'Sparkles', 'GraduationCap', 'Clapperboard', 'ShoppingBag', 'HeartPulse', 'MoreHorizontal'],
  bill: ['Home', 'Zap', 'Droplets', 'Smartphone', 'Flame', 'Wifi', 'Music', 'Youtube', 'Clapperboard', 'Dumbbell', 'Shield', 'MoreHorizontal'],
  goal: ['PiggyBank', 'Plane', 'Home', 'Car', 'Laptop', 'Gift', 'Sparkles', 'ShoppingBag'],
  debt: ['Landmark', 'Car', 'Smartphone', 'CreditCard', 'Home', 'MoreHorizontal'],
};

export function Icon({ name, size = 18 }) {
  const Cmp = ICONS[name] || Wallet;
  return <Cmp size={size} />;
}

export function IconBadge({ name, color = 'accent', size = 18 }) {
  return (
    <div className="icon-badge" style={{ background: `var(--${color}-soft)`, color: `var(--${color})` }}>
      <Icon name={name} size={size} />
    </div>
  );
}

export function StatCard({ label, value, hint, icon, color = 'accent' }) {
  return (
    <div className="card stat">
      <div className="stat-label">
        {icon && <span style={{ color: `var(--${color})`, display: 'flex' }}><Icon name={icon} size={15} /></span>}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function ProgressBar({ pct, color = 'accent' }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const barColor =
    color === 'auto' ? (pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--green)') : `var(--${color})`;
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${clamped}%`, background: barColor }} />
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function IconPicker({ set, value, onChange }) {
  return (
    <div className="field">
      <label>Icon</label>
      <div className="icon-picker">
        {ICON_SETS[set].map((name) => (
          <button
            key={name}
            type="button"
            className={`icon-option ${value === name ? 'selected' : ''}`}
            onClick={() => onChange(name)}
          >
            <Icon name={name} size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
