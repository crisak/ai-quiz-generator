import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemePreference } from '../store/themeStore';

type ThemeToggleSize = 'sm' | 'md';

interface ThemeToggleProps {
  size?: ThemeToggleSize;
}

function getOptions(iconSize: number): { value: ThemePreference; icon: React.ReactNode; label: string }[] {
  return [
    { value: 'light',  icon: <Sun size={iconSize} />,     label: 'Modo claro' },
    { value: 'system', icon: <Monitor size={iconSize} />, label: 'Seguir sistema' },
    { value: 'dark',   icon: <Moon size={iconSize} />,    label: 'Modo oscuro' },
  ];
}

export function ThemeToggle({ size = 'sm' }: ThemeToggleProps) {
  const { preference, setPreference } = useThemeStore();

  const outerPadding = size === 'md' ? 'p-1' : 'p-0.5';
  const btnPadding   = size === 'md' ? 'p-2.5' : 'p-1.5';
  const iconSize     = size === 'md' ? 18 : 13;
  const options      = getOptions(iconSize);

  return (
    <div className={`flex items-center bg-slate-900 border border-slate-700 rounded-lg ${outerPadding}`}>
      {options.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => setPreference(value)}
          title={label}
          className={`${btnPadding} rounded-md transition-all ${
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
