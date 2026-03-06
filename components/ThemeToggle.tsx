import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemePreference } from '../store/themeStore';

const OPTIONS: { value: ThemePreference; icon: React.ReactNode; label: string }[] = [
  { value: 'light',  icon: <Sun size={13} />,     label: 'Modo claro' },
  { value: 'system', icon: <Monitor size={13} />, label: 'Seguir sistema' },
  { value: 'dark',   icon: <Moon size={13} />,    label: 'Modo oscuro' },
];

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore();

  return (
    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
      {OPTIONS.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => setPreference(value)}
          title={label}
          className={`p-1.5 rounded-md transition-all ${
            preference === value
              ? 'bg-slate-800 text-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
