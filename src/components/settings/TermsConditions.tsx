import { ChevronLeft, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface TermsConditionsProps {
  onBack: () => void;
}

export default function TermsConditions({ onBack }: TermsConditionsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto"
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Terms & Conditions</h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Rules of the island</p>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-32">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText size={40} />
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last updated: March 28, 2026</p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">1. Acceptance of Terms</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            By accessing or using the GiliHub application, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">2. User Accounts</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">3. User Content</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            Users may post content in the forum and chat sections. You retain all rights to your content, but you grant GiliHub a non-exclusive, royalty-free license to use, reproduce, and display that content in connection with the service. You agree not to post any content that is illegal, offensive, or infringes on the rights of others.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">4. Bookings and Transactions</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            GiliHub facilitates bookings for events and services. All transactions are subject to availability and confirmation. We are not responsible for any issues arising from third-party service providers. Please review the specific cancellation policies for each booking.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">5. Disclaimer of Warranties</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            The materials on GiliHub are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">6. Limitations</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            In no event shall GiliHub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GiliHub.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">7. Modifications</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            We may revise these terms of service for its app at any time without notice. By using this app you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
