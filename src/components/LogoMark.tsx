import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import qcLogoUrl from '../assets/images/qc_waste_watch_logo_1795396734446.jpg';

interface LogoMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoMark({ size = 'md', className = '' }: LogoMarkProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const dimensions =
    size === 'sm'
      ? 'w-11 h-11 rounded-xl'
      : size === 'lg'
      ? 'w-32 h-32 sm:w-36 sm:h-36 rounded-2xl'
      : 'w-16 h-16 rounded-2xl';

  if (imgFailed) {
    return (
      <div
        className={`${dimensions} bg-gradient-to-br from-emerald-700 to-emerald-900 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-sm shrink-0 ${className}`}
        aria-label="QC Waste Watch emblem"
      >
        <ShieldCheck className={size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'} />
      </div>
    );
  }

  return (
    <div
      className={`${dimensions} bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0 ${className}`}
    >
      <img
        src={qcLogoUrl}
        alt="Quezon City Waste Watch Official Logo"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
}
