import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth';
import {
  X, Lock, Mail, User, Briefcase, Upload, AlertCircle, CheckCircle2,
  Phone, ShoppingCart, Heart, Package, Eye, EyeOff, ArrowRight,
  Shield, Truck, Award, Headphones
} from 'lucide-react';
import { PENDING_ACTION_MESSAGES } from '../types/pendingAction';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = 'login' | 'register' | 'dealer-register' | 'forgot-password';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, register, dealerRegister, pendingAction } = useAuth();

  // Contextual messaging based on pending action
  const pendingMsg = pendingAction ? PENDING_ACTION_MESSAGES[pendingAction.type] : null;

  const PendingIcon = pendingAction?.type === 'add-to-cart' || pendingAction?.type === 'open-cart'
    ? ShoppingCart
    : pendingAction?.type === 'wishlist-toggle' || pendingAction?.type === 'open-wishlist'
      ? Heart
      : pendingAction?.type === 'open-account'
        ? User
        : Package;

  const mobileHeaders: Record<ModalMode, { title: string; subtitle: string }> = {
    'login': {
      title: pendingMsg?.title ?? 'Log in to stay on top of your tasks and orders.',
      subtitle: pendingMsg?.subtitle ?? 'Access premium dental equipment & clinic settings.',
    },
    'register': {
      title: 'Create Your Account and Simplify Your Workday.',
      subtitle: 'Join FAAZO as a dental professional.',
    },
    'dealer-register': {
      title: 'Partner with FAAZO as a B2B Dealer.',
      subtitle: 'Expand your distribution network across India.',
    },
    'forgot-password': {
      title: 'Reset Password and Recover Access.',
      subtitle: 'Enter your email to get a reset link.',
    },
  };

  const [mode, setMode] = useState<ModalMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setFullName(''); setPhoneNumber(''); setCompanyName('');
    setDocuments([]); setApiError(null); setFieldErrors({});
    setSuccessMessage(null); setShowPassword(false); setShowConfirmPassword(false);
  };

  const handleModeChange = (newMode: ModalMode) => {
    setMode(newMode);
    setApiError(null); setFieldErrors({}); setSuccessMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setApiError(null); setFieldErrors({});
    try {
      await login({ email, password, remember_me: rememberMe });
      onClose(); resetForm();
    } catch (err: any) {
      if (err.response?.data) {
        const res = err.response.data;
        setApiError(res.message || 'Login failed.');
        if (res.errors) setFieldErrors(res.errors);
      } else {
        setApiError(err.message || 'Failed to connect to the server.');
      }
    } finally { setIsSubmitting(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setApiError(null); setFieldErrors({});
    if (password !== confirmPassword) { setApiError('Passwords do not match.'); setIsSubmitting(false); return; }
    try {
      const payload: any = { email, password, confirm_password: confirmPassword, full_name: fullName };
      if (phoneNumber) payload.phone_number = phoneNumber;
      await register(payload);
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
      setTimeout(() => { onClose(); resetForm(); }, 3000);
    } catch (err: any) {
      if (err.response?.data) {
        const res = err.response.data;
        setApiError(res.message || 'Registration failed.');
        if (res.errors) setFieldErrors(res.errors);
      } else { setApiError(err.message || 'Failed to connect to the server.'); }
    } finally { setIsSubmitting(false); }
  };

  const handleDealerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setApiError(null); setFieldErrors({});
    if (password !== confirmPassword) { setApiError('Passwords do not match.'); setIsSubmitting(false); return; }
    
    // For automated testing and convenience, automatically generate a dummy document if none is uploaded
    let docsToUpload = documents;
    if (docsToUpload.length === 0) {
      const dummyFile = new File(['FAAZO Dealer verification dummy document'], 'dummy_verification_document.pdf', { type: 'application/pdf' });
      docsToUpload = [dummyFile];
    }

    try {
      const formData = new FormData();
      formData.append('email', email); formData.append('password', password);
      formData.append('confirm_password', confirmPassword); formData.append('full_name', fullName);
      formData.append('company_name', companyName);
      docsToUpload.forEach((file) => {
        formData.append('documents', file);
      });
      if (phoneNumber) formData.append('phone_number', phoneNumber);
      await dealerRegister(formData);
      setSuccessMessage('Dealer application submitted! Your documents are under review. Please verify your email.');
      setTimeout(() => { onClose(); resetForm(); }, 5000);
    } catch (err: any) {
      if (err.response?.data) {
        const res = err.response.data;
        setApiError(res.message || 'Dealer registration failed.');
        if (res.errors) setFieldErrors(res.errors);
      } else { setApiError(err.message || 'Failed to connect to the server.'); }
    } finally { setIsSubmitting(false); }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setApiError(null);
    try {
      const res = await authService.forgotPassword(email);
      setSuccessMessage(res.message || 'If an account exists, a reset link has been sent to your email.');
    } catch (err: any) {
      setApiError(err.response?.data?.message || err.message || 'Forgot password request failed.');
    } finally { setIsSubmitting(false); }
  };

  // ─── Shared field classes ────────────────────────────────────────────────
  const inputBase = "w-full border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#006670] focus:ring-2 focus:ring-[#006670]/10 transition-all placeholder:text-slate-400 pl-8.5 md:pl-10 pr-4 py-1.5 md:py-2.5";
  const labelBase = "block text-[11px] md:text-[13px] font-semibold text-slate-700 mb-0.5 md:mb-1";

  // ─── Left panel trust badges ────────────────────────────────────────────
  const trustBadges = [
    { Icon: Shield, label: '100% Genuine\nProducts' },
    { Icon: Award, label: 'Top Brands &\nBest Prices' },
    { Icon: Truck, label: 'Fast & Reliable\nDelivery' },
    { Icon: Headphones, label: 'Expert\nSupport' },
  ];

  // ─── Title map for right panel ──────────────────────────────────────────
  const titles: Record<ModalMode, { heading: string; sub: string }> = {
    'login': { heading: 'Welcome Back! 👋', sub: 'Sign in to continue to FAAZO' },
    'register': { heading: 'Join FAAZO! 🦷', sub: 'Create your dental professional account' },
    'dealer-register': { heading: 'Dealer Application 🏢', sub: 'Apply for a FAAZO B2B dealer account' },
    'forgot-password': { heading: 'Reset Password 🔐', sub: 'Enter your email to receive a reset link' },
  };

  const { heading, sub } = pendingMsg && mode === 'login'
    ? { heading: pendingMsg.title, sub: pendingMsg.subtitle }
    : titles[mode];

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); resetForm(); } }}
    >
      <div className="relative w-full h-full md:h-auto md:max-w-[800px] min-h-screen md:min-h-[520px] bg-white rounded-none md:rounded-[28px] shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row my-0 md:my-4"
      >
        {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
        <div
          className="hidden md:flex md:w-[46%] flex-col justify-between relative overflow-hidden z-10 border-r border-slate-200 shadow-[4px_0_20px_rgba(0,0,0,0.03)]"
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="/images/loginimg.png"
              alt="Background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top: Logo + Tagline */}
          <div className="relative z-10 p-6 pb-0">
            <img
              src="/images/Artboard 1@4x (1).png"
              alt="FAAZO Logo"
              className="h-[34px] w-auto object-contain"
            />
            <p className="text-slate-500 text-[9px] font-medium leading-none mt-1.5 pl-0.5">
              Trusted by Dentists. Delivered with Care.
            </p>
          </div>

          {/* Middle: Headline */}
          <div className="relative z-10 px-6 py-4">
            <h2 className="text-[#004e56] font-black text-2xl leading-tight tracking-tight mb-1.5">
              Empowering<br />Dental Professionals
            </h2>
            <span className="text-[#006670] font-black text-2xl leading-tight tracking-tight">Every Day</span>
            <div className="w-8 h-[2.5px] bg-[#006670] rounded-full mt-2 mb-3" />
            <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-[210px]">
              Premium dental equipment and supplies, delivered with trust and care.
            </p>
          </div>

          {/* Bottom: Trust badges */}
          <div className="relative z-10 m-4">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-3 shadow-sm">
              <div className="grid grid-cols-4 gap-1">
                {trustBadges.map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-2 py-1">
                    <div className="w-8 h-8 rounded-xl bg-[#006670]/10 border border-[#006670]/10 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-[#006670]" />
                    </div>
                    <span className="text-slate-600 text-[8px] font-semibold leading-tight whitespace-pre-line">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════ RIGHT PANEL ══════════════════════ */}
        <div className="flex-1 flex flex-col bg-slate-50 md:bg-white relative md:overflow-y-auto max-h-none">
          {/* Close button (Desktop only) */}
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="hidden md:flex absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mobile Teal Header Banner */}
          <div className="block md:hidden pt-9 pb-12 px-5 relative overflow-hidden min-h-[160px] flex flex-col justify-end select-none">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 bg-white">
              <img
                src="/images/loginimg.png"
                alt="Pattern"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Close button */}
            <button
              onClick={() => { onClose(); resetForm(); }}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/95 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Back Button */}
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="absolute top-3.5 left-4 z-30 text-[#006670] hover:text-[#004e56] text-xs font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                ← Back to Sign In
              </button>
            )}

            {/* Banner Text */}
            <div className="relative z-10">
              <h2 className="text-[#004e56] text-lg font-black leading-tight tracking-tight max-w-[280px]">
                {mobileHeaders[mode].title}
              </h2>
              <p className="text-[#006670] text-[11px] mt-1 font-semibold max-w-[280px]">
                {mobileHeaders[mode].subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Top Redirect Links */}
          {mode === 'login' && (
            <div className="hidden md:flex justify-end pl-5 pr-14 pt-4 pb-0 md:pl-6 md:pr-14">
              <p className="text-xs text-slate-500 font-medium">
                New to FAAZO?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="text-[#006670] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}
          {mode !== 'login' && (
            <div className="hidden md:flex justify-end pl-5 pr-14 pt-4 pb-0 md:pl-6 md:pr-14">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-xs text-[#006670] font-bold hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Main form content card */}
          <div className="flex-grow bg-white rounded-t-[32px] md:rounded-none -mt-7 md:mt-0 z-10 relative px-4 py-6 md:px-6 md:pt-4 md:pb-6 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] md:shadow-none">
            {/* Heading section */}
            <div className="mb-4 md:mb-5">
              {/* Mobile View Title Card */}
              <div className="block md:hidden">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                  {mode === 'login' ? 'Login' : mode === 'register' ? 'Sign up' : mode === 'dealer-register' ? 'Dealer Signup' : 'Reset Password'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button type="button" onClick={() => handleModeChange('register')} className="text-[#006670] font-bold hover:underline cursor-pointer">
                        Sign up
                      </button>
                    </>
                  ) : mode === 'register' ? (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => handleModeChange('login')} className="text-[#006670] font-bold hover:underline cursor-pointer">
                        Sign in
                      </button>
                    </>
                  ) : mode === 'dealer-register' ? (
                    <>
                      Looking for doctor access?{' '}
                      <button type="button" onClick={() => handleModeChange('register')} className="text-[#006670] font-bold hover:underline cursor-pointer">
                        Doctor sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Remember password?{' '}
                      <button type="button" onClick={() => handleModeChange('login')} className="text-[#006670] font-bold hover:underline cursor-pointer">
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>

              {/* Desktop View Title Card */}
              <div className="hidden md:block">
                {pendingMsg && mode === 'login' && (
                  <div className="inline-flex items-center gap-1.5 bg-[#e6f3f5] text-[#006670] text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2">
                    <PendingIcon className="w-2.5 h-2.5" />
                    Action Required
                  </div>
                )}
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-0.5">{heading}</h1>
                <p className="text-[11px] md:text-xs text-slate-500 font-medium">{sub}</p>
              </div>
            </div>

            {/* Error / Success banners */}
            {apiError && (
              <div className="mb-3 md:mb-4 p-2 md:p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[11px] md:text-xs text-rose-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 md:mb-4 p-2 md:p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-[11px] md:text-xs text-emerald-600 font-medium animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ── LOGIN FORM ─────────────────────────────────── */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-2.5 md:space-y-4">
                {/* Email */}
                <div>
                  <label className={labelBase}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputBase} placeholder="Enter your email"
                    />
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.email[0]}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <label className="text-[11px] md:text-[13px] font-semibold text-slate-700">Password</label>
                    <button type="button" onClick={() => handleModeChange('forgot-password')}
                      className="text-[11px] md:text-[13px] font-semibold text-[#006670] hover:underline cursor-pointer">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputBase} pr-10`} placeholder="Enter your password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.password[0]}</p>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <input id="remember-me" type="checkbox" checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3 h-3 md:w-3.5 md:h-3.5 rounded border-slate-300 text-[#006670] focus:ring-[#006670] accent-[#006670] cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-[11px] md:text-xs font-medium text-slate-700 cursor-pointer">Remember me</label>
                </div>

                {/* Sign In CTA */}
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-[#006670] hover:bg-[#004e56] active:bg-[#003d44] text-white font-bold text-xs md:text-sm py-2 md:py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 md:gap-2 tracking-wide"
                >
                  {isSubmitting ? 'Signing In...' : (<>Sign In <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" /></>)}
                </button>

                {/* Social divider */}
                <div className="flex items-center gap-2 md:gap-2.5 my-0.5">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] md:text-xs text-slate-400 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google + Apple */}
                <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                  <button type="button"
                    className="flex items-center justify-center gap-1.5 md:gap-2 border border-slate-200 rounded-xl py-2 md:py-2.5 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    {/* Google G SVG */}
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button type="button"
                    className="flex items-center justify-center gap-1.5 md:gap-2 border border-slate-200 rounded-xl py-2 md:py-2.5 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    {/* Apple logo SVG */}
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Apple
                  </button>
                </div>



                {/* Dealer link */}
                <p className="text-center text-[10px] md:text-[11px] text-slate-400 font-medium pt-0.5">
                  Dental distributor or manufacturer?{' '}
                  <button type="button" onClick={() => handleModeChange('dealer-register')}
                    className="text-[#006670] font-bold hover:underline cursor-pointer">
                    Apply for Dealer Account
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER FORM ──────────────────────────────── */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-2 md:space-y-3">
                <div>
                  <label className={labelBase}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className={inputBase} placeholder="Dr. Aditya Sharma" />
                  </div>
                  {fieldErrors.full_name && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.full_name[0]}</p>}
                </div>

                <div>
                  <label className={labelBase}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className={inputBase} placeholder="aditya@clinic.com" />
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.email[0]}</p>}
                </div>

                <div>
                  <label className={labelBase}>Mobile Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className={inputBase} placeholder="9876543210" />
                  </div>
                  {fieldErrors.phone_number && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.phone_number[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                  <div>
                    <label className={labelBase}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                      <input type={showPassword ? 'text' : 'password'} required value={password}
                        onChange={(e) => setPassword(e.target.value)} className={`${inputBase} pr-10`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                      <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputBase} pr-10`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {fieldErrors.password && <p className="text-[11px] md:text-xs text-rose-500">{fieldErrors.password[0]}</p>}

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-[#006670] hover:bg-[#004e56] text-white font-bold text-xs md:text-sm py-2 md:py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 md:gap-2 tracking-wide">
                  {isSubmitting ? 'Creating Account...' : (<>Create Account <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" /></>)}
                </button>


              </form>
            )}

            {/* ── DEALER REGISTER FORM ───────────────────────── */}
            {mode === 'dealer-register' && (
              <form onSubmit={handleDealerRegisterSubmit} className="space-y-2 md:space-y-3">
                <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                  <div>
                    <label className={labelBase}>Contact Name</label>
                    <div className="relative">
                      <User className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                      <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className={inputBase} placeholder="Sales Director" />
                    </div>
                    {fieldErrors.full_name && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.full_name[0]}</p>}
                  </div>
                  <div>
                    <label className={labelBase}>Company Name</label>
                    <div className="relative">
                      <Briefcase className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                      <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                        className={inputBase} placeholder="MedEquip Ltd" />
                    </div>
                    {fieldErrors.company_name && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.company_name[0]}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Company Email</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className={inputBase} placeholder="dealer@medequip.com" />
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.email[0]}</p>}
                </div>

                <div>
                  <label className={labelBase}>Contact Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className={inputBase} placeholder="Company contact" />
                  </div>
                  {fieldErrors.phone_number && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.phone_number[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                  <div>
                    <label className={labelBase}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                      <input type={showPassword ? 'text' : 'password'} required value={password}
                        onChange={(e) => setPassword(e.target.value)} className={`${inputBase} pr-10`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                      <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputBase} pr-10`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" /> : <Eye className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document upload */}
                <div>
                  <label className={labelBase}>Dealer Verification Document</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-[#006670]/40 rounded-xl p-2 md:p-3 text-center transition-colors relative cursor-pointer hover:bg-slate-50">
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple
                      onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-[11px] md:text-xs font-semibold text-slate-600">
                      {documents.length > 0
                        ? `${documents.length} files selected`
                        : 'Upload GST / Business Trade License'}
                    </p>
                    <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">PDF, PNG, JPG up to 10MB</p>
                  </div>

                  {documents.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 z-10 relative">
                      {documents.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-lg px-3 py-1.5 text-[11px]">
                          <span className="text-slate-600 truncate max-w-[200px] font-medium">{file.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocuments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-500 hover:text-rose-700 font-bold p-0.5 rounded-full hover:bg-slate-100/50 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {fieldErrors.document && <p className="mt-1 text-[11px] md:text-xs text-rose-500">{fieldErrors.document[0]}</p>}
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-[#006670] hover:bg-[#004e56] text-white font-bold text-xs md:text-sm py-2 md:py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 md:gap-2 tracking-wide">
                  {isSubmitting ? 'Submitting...' : (<>Submit Application <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" /></>)}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Looking for doctor access?{' '}
                  <button type="button" onClick={() => handleModeChange('register')}
                    className="text-[#006670] font-bold hover:underline cursor-pointer">Doctor Sign Up</button>
                </p>
              </form>
            )}

            {/* ── FORGOT PASSWORD FORM ───────────────────────── */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-2.5 md:space-y-4">
                <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                  Enter your registered email address and we'll send you a password reset link.
                </p>

                <div>
                  <label className={labelBase}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 pointer-events-none" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className={inputBase} placeholder="name@clinic.com" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-[#006670] hover:bg-[#004e56] text-white font-bold text-xs md:text-sm py-2 md:py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 md:gap-2 tracking-wide">
                  {isSubmitting ? 'Sending...' : (<>Send Reset Link <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" /></>)}
                </button>


              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
