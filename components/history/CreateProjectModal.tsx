import React, { useState } from 'react';
import type { CreateProjectInput } from '../../repositories/interfaces';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

const PROJECT_COLORS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Naranja' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#ec4899', label: 'Rosa' },
];

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (data: CreateProjectInput) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0].value);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() || undefined, color });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-slate-900 border border-slate-700 rounded-2xl w-80 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white font-semibold text-sm">Nuevo proyecto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del proyecto"
            maxLength={60}
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-blue-500"
          />

          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            maxLength={200}
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 resize-none"
          />

          <div>
            <p className="text-slate-400 text-xs mb-2">Color</p>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="w-6 h-6 rounded-full transition-all"
                  style={{
                    backgroundColor: c.value,
                    outline: color === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium"
          >
            {loading ? 'Creando...' : 'Crear proyecto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
