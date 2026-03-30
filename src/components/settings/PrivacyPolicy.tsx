import { ChevronLeft, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Privacy Policy</h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">How we protect your data</p>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-32">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield size={40} />
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last updated: March 28, 2026</p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">1. Information We Collect</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            We collect information you provide directly to us when you create an account, update your profile, use the interactive features of the app (like forums and chat), or communicate with us. This may include your name, email address, profile picture, and any other information you choose to provide.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">2. How We Use Your Information</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            We use the information we collect to provide, maintain, and improve our services. This includes personalizing your experience, facilitating communication between users, processing bookings, and sending you technical notices, updates, and support messages.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">3. Sharing of Information</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            We do not share your personal information with third parties except as described in this privacy policy. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">4. Data Security</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">5. Your Choices</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            You may update, correct, or delete your account information at any time by logging into your account or contacting us. You may also opt out of receiving promotional communications from us by following the instructions in those communications.
          </p>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3">6. Contact Us</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            If you have any questions about this Privacy Policy, please contact us at privacy@gilihub.com.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
