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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-500">
              <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 bg-rose-600 text-white font-bold py-2.5 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
