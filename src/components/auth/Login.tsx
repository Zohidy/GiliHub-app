import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MapPin, 
  Shield, 
  Zap, 
  Globe, 
  MessageSquare, 
  Calendar, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Loader2, 
  Phone, 
  Ghost, 
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationResult } from 'firebase/auth';
import { Logo } from '../Logo';

type AuthMode = 'email' | 'phone' | 'anonymous';

const FeatureItem = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
  >
    <div className="p-3 rounded-xl bg-electric-blue/10 text-electric-blue group-hover:bg-electric-blue group-hover:text-white transition-all duration-300">
      {Icon}
    </div>
    <div>
      <h3 className="font-display font-bold text-white text-lg tracking-tight">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mt-1">{desc}</p>
    </div>
  </motion.div>
);

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAnonymously, setupRecaptcha, signInWithPhone } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  
  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Phone State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'email') {
        if (isLogin) {
          await signInWithEmail(email, password);
        } else {
          if (!displayName.trim()) {
            throw new Error('Name is required');
          }
          await signUpWithEmail(email, password, displayName);
        }
      } else if (authMode === 'phone') {
        if (!confirmationResult) {
          // Normalize phone number: remove spaces, dashes, and ensure it starts with +
          let formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
          
          if (!formattedPhone.startsWith('+')) {
            // If it starts with 0, assume it's an Indonesian number (Gili Trawangan context)
            if (formattedPhone.startsWith('0')) {
              formattedPhone = '+62' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('62')) {
              formattedPhone = '+' + formattedPhone;
            } else {
              // Default to + if no prefix, but this might still fail if it's not a full number
              formattedPhone = '+' + formattedPhone;
            }
          }

          if (formattedPhone.length < 8) {
            throw new Error('Please enter a valid phone number with country code (e.g., +62...)');
          }

          const appVerifier = setupRecaptcha('recaptcha-container');
          const result = await signInWithPhone(formattedPhone, appVerifier);
          setConfirmationResult(result);
        } else {
          await confirmationResult.confirm(verificationCode);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      // Reset recaptcha if phone fails
      if (authMode === 'phone' && !confirmationResult) {
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please add this URL to your Firebase Console authorized domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion. Please try again.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInAnonymously();
    } catch (err: any) {
      console.error("Anonymous Sign-In Error:", err);
      if (err.code === 'auth/admin-restricted-operation') {
        setError('Anonymous sign-in is currently disabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Anonymous sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 overflow-hidden font-sans">
      {/* Left Side: Branding & Features (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-electric-blue/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-electric-blue/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-electric-blue rounded-xl flex items-center justify-center shadow-lg shadow-electric-blue/20">
              <Logo className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">GiliHub</span>
          </motion.div>

          <div className="mt-20 space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl font-black text-white leading-[0.9] tracking-tighter"
            >
              EXPLORE THE <br />
              <span className="text-electric-blue">ISLAND LIFE.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-lg max-w-md font-medium"
            >
              Your all-in-one companion for navigating, booking, and connecting in the Gili Islands.
            </motion.p>
          </div>

          <div className="mt-16 space-y-4">
            <FeatureItem 
              icon={<MapPin size={24} />} 
              title="Interactive Discovery" 
              desc="Find hidden gems, local favorites, and essential services with our real-time map." 
              delay={0.4}
            />
            <FeatureItem 
              icon={<Calendar size={24} />} 
              title="Seamless Bookings" 
              desc="Book boats, tours, and experiences directly from your phone with instant confirmation." 
              delay={0.5}
            />
            <FeatureItem 
              icon={<MessageSquare size={24} />} 
              title="Island Community" 
              desc="Connect with locals and travelers, share tips, and stay updated on island events." 
              delay={0.6}
            />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
          <span>© 2026 GILIHUB PROJECT</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center shadow-lg shadow-electric-blue/20">
            <Logo className="text-white" size={18} />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">GiliHub</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                {authMode === 'anonymous' ? 'Welcome to GiliHub! Explore the island as a guest.' : isLogin ? 'Welcome back! Ready for more island adventures?' : 'Join the GiliHub community! Let\'s start your island adventure.'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">
                {authMode === 'anonymous' 
                  ? "Try the app without an account." 
                  : isLogin 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                {authMode !== 'anonymous' && (
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-electric-blue dark:text-electric-blue font-bold hover:underline underline-offset-4"
                  >
                    {isLogin ? 'Create one now' : 'Sign in here'}
                  </button>
                )}
              </p>
            </motion.div>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-8">
            {(['email', 'phone', 'anonymous'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setAuthMode(m);
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  authMode === m 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode + (isLogin ? 'login' : 'signup')}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {authMode === 'email' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={20} />
                          <input 
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white"
                            required
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={20} />
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                        {isLogin && (
                          <button type="button" className="text-[10px] font-bold text-electric-blue dark:text-electric-blue uppercase tracking-widest hover:underline">Forgot?</button>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={20} />
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 dark:shadow-none"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          {isLogin ? 'Sign In' : 'Create Account'}
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {authMode === 'phone' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!confirmationResult ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={20} />
                          <input 
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+62 812 3456 7890"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Verification Code</label>
                        <input 
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="123456"
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium text-center text-2xl tracking-[0.5em] dark:text-white"
                          required
                        />
                      </div>
                    )}
                    
                    <div id="recaptcha-container" className="flex justify-center"></div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 dark:shadow-none"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          {!confirmationResult ? 'Send Code' : 'Verify & Sign In'}
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    {confirmationResult && (
                      <button 
                        type="button"
                        onClick={() => { setConfirmationResult(null); setVerificationCode(''); }}
                        className="w-full text-slate-500 dark:text-slate-400 text-[10px] font-bold hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Change Phone Number
                      </button>
                    )}
                  </form>
                )}

                {authMode === 'anonymous' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-electric-blue/10 dark:bg-electric-blue/20 border border-electric-blue/20 dark:border-electric-blue/30 rounded-3xl">
                      <div className="flex items-center gap-3 text-electric-blue dark:text-electric-blue mb-3">
                        <ShieldCheck size={24} />
                        <h3 className="font-bold">Guest Access</h3>
                      </div>
                      <p className="text-sm text-electric-blue/80 dark:text-electric-blue/80 leading-relaxed font-medium">
                        Try GiliHub without an account. You can browse the map and see public events, but some features like booking and forum posting will be limited.
                      </p>
                    </div>
                    <button 
                      onClick={handleAnonymousSignIn}
                      disabled={isLoading}
                      className="w-full py-4 bg-electric-blue text-white rounded-2xl font-bold text-lg hover:bg-electric-blue/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-electric-blue/20"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          Continue as Guest
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Social Login */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white dark:bg-slate-950 px-4 text-slate-400 dark:text-slate-500">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating Status Bar (Mobile Only) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>Server Live</span>
        </div>
        <div className="w-px h-3 bg-white/10"></div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-electric-blue" />
          <span>Secure SSL</span>
        </div>
      </div>
    </div>
  );
}

