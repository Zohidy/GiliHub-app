import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass dark:glass-dark rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border-0 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/50" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-rose-500/10 dark:bg-rose-500/20 p-4 rounded-[1.5rem] text-rose-600 dark:text-rose-400 mb-4 shadow-inner">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium leading-relaxed">
                {message}
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 glass-input dark:glass-input-dark text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl hover:bg-white/40 dark:hover:bg-white/10 transition-all disabled:opacity-50 uppercase tracking-widest text-[10px]"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 bg-rose-600/90 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20 active:scale-95"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
