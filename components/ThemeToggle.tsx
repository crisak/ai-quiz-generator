import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemePreference } from '../store/themeStore';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

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

  const iconSize = size === 'md' ? 16 : 13;
  const options  = getOptions(iconSize);

  return (
    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
      {options.map(({ value, icon, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="icon"
          onClick={() => setPreference(value)}
          title={label}
          className={cn(
            size === 'md' ? 'h-8 w-8' : 'h-6 w-6',
            'rounded-md transition-all',
            preference === value
              ? 'bg-slate-800 text-slate-200 shadow-sm hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-300 hover:bg-transparent',
          )}
        >
          {icon}
        </Button>
      ))}
    </div>
  );
}
