import { useState } from 'react';
import { User } from 'lucide-react';

// ─── Color palette for initials ────────────────────────────────────────────

const COMPANY_COLORS = [
  { bg: 'bg-blue-600', text: 'text-blue-100' },
  { bg: 'bg-emerald-600', text: 'text-emerald-100' },
  { bg: 'bg-violet-600', text: 'text-violet-100' },
  { bg: 'bg-amber-600', text: 'text-amber-100' },
  { bg: 'bg-rose-600', text: 'text-rose-100' },
  { bg: 'bg-cyan-600', text: 'text-cyan-100' },
  { bg: 'bg-orange-600', text: 'text-orange-100' },
  { bg: 'bg-indigo-600', text: 'text-indigo-100' },
  { bg: 'bg-teal-600', text: 'text-teal-100' },
  { bg: 'bg-pink-600', text: 'text-pink-100' },
];

const AVATAR_COLORS = [
  { bg: 'bg-sky-700', text: 'text-sky-200' },
  { bg: 'bg-purple-700', text: 'text-purple-200' },
  { bg: 'bg-emerald-700', text: 'text-emerald-200' },
  { bg: 'bg-amber-700', text: 'text-amber-200' },
  { bg: 'bg-rose-700', text: 'text-rose-200' },
  { bg: 'bg-cyan-700', text: 'text-cyan-200' },
  { bg: 'bg-indigo-700', text: 'text-indigo-200' },
  { bg: 'bg-teal-700', text: 'text-teal-200' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/[\s,.-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── CompanyLogo ────────────────────────────────────────────────────────────

interface CompanyLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const LOGO_SIZES = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function CompanyLogo({ name, logoUrl, size = 'md', className = '' }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = LOGO_SIZES[size];
  const colorIdx = hashString(name) % COMPANY_COLORS.length;
  const color = COMPANY_COLORS[colorIdx];
  const initial = name.trim() ? name.trim()[0].toUpperCase() : '?';

  if (logoUrl && !imgError) {
    return (
      <div className={`${sizeClass} rounded-lg overflow-hidden shrink-0 bg-muted ${className}`}>
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-lg ${color.bg} flex items-center justify-center shrink-0 font-bold ${color.text} ${className}`}>
      {initial}
    </div>
  );
}

// ─── StakeholderAvatar ──────────────────────────────────────────────────────

interface StakeholderAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZES = {
  xs: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-[8px]' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-[10px]' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xs' },
  lg: { container: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-base' },
};

export function StakeholderAvatar({ name, avatarUrl, size = 'md', className = '' }: StakeholderAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = AVATAR_SIZES[size];
  const colorIdx = hashString(name) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[colorIdx];
  const initials = getInitials(name);

  if (avatarUrl && !imgError) {
    return (
      <div className={`${sizeConfig.container} rounded-full overflow-hidden shrink-0 bg-muted ${className}`}>
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: colored circle with initials + subtle person icon overlay
  return (
    <div className={`${sizeConfig.container} rounded-full ${color.bg} flex items-center justify-center shrink-0 relative ${className}`}>
      <span className={`font-semibold ${color.text} ${sizeConfig.text}`}>{initials}</span>
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-background/80 flex items-center justify-center">
        <User className="w-2 h-2 text-muted-foreground" />
      </div>
    </div>
  );
}
