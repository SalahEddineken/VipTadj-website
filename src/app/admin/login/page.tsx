'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth, MOCK_ADMIN_CREDENTIALS } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight, Check, Crown } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, isLoading } = useAdminAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(t('admin.login.required_fields', 'Veuillez renseigner votre email et mot de passe.'));
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      router.replace('/admin');
    } else {
      setErrorMessage(result.error || t('admin.login.invalid_credentials', 'Identifiants invalides.'));
    }
  };

  const fillDemoCredentials = () => {
    setEmail(MOCK_ADMIN_CREDENTIALS.email);
    setPassword(MOCK_ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col justify-center items-center p-4 selection:bg-gold-500 selection:text-obsidian-950">
      <div className="w-full max-w-md space-y-6">
        {/* Luxury Brand Monogram Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-obsidian-900 border border-gold-500/30 shadow-luxury-card mb-2">
            <Crown className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="font-cinzel text-2xl font-bold tracking-widest text-gold-400">
            VIP TADJ
          </h1>
          <p className="text-xs tracking-widest text-obsidian-300 uppercase font-sans">
            {t('admin.login.header', 'Portail Administratif & Direction')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-obsidian-900/90 border border-gold-500/20 rounded-sm p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-sm bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-medium text-obsidian-200 uppercase tracking-wider">
                {t('admin.login.email', 'Email Professionnel')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-300" />
                <input
                  id="admin-email"
                  type="email"
                  aria-label={t('admin.login.email', 'Email Professionnel')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('admin.login.email_ph', 'admin@viptadj.dz')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-base md:text-sm placeholder:text-sand-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-medium text-obsidian-200 uppercase tracking-wider">
                {t('admin.login.password', 'Mot de Passe')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-300" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  aria-label={t('admin.login.password', 'Mot de Passe')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full ps-10 pe-10 py-2.5 rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-base md:text-sm placeholder:text-sand-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-obsidian-300 hover:text-gold-400 min-w-[44px] min-h-[44px] flex items-center justify-center -me-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                  aria-label={showPassword ? t('admin.login.hide_password_aria', 'Masquer le mot de passe') : t('admin.login.show_password_aria', 'Afficher le mot de passe')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isLoading}
              aria-label={t('admin.login.submit', 'Connexion au Tableau de Bord')}
              className="w-full py-3 rounded-sm bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-luxury-gold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
                  <span>{t('admin.login.processing', 'Connexion en cours...')}</span>
                </>
              ) : (
                <>
                  <span>{t('admin.login.submit', 'Connexion au Tableau de Bord')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Card */}
          <div className="mt-6 pt-5 border-t border-gold-500/15">
            <div className="p-3.5 rounded-sm bg-obsidian-950/70 border border-gold-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gold-400 tracking-wider uppercase">
                  {t('admin.login.demo_card_title', 'Accès Démonstration & Évaluation')}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {t('admin.login.demo_status_ready', 'Prêt')}
                </span>
              </div>
              <div className="text-[11px] text-obsidian-200 font-mono space-y-0.5">
                <div>
                  {t('admin.login.email', 'Email')} : <span className="text-gold-300">{MOCK_ADMIN_CREDENTIALS.email}</span>
                </div>
                <div>
                  {t('admin.login.password', 'Mot de passe')} : <span className="text-gold-300">{MOCK_ADMIN_CREDENTIALS.password}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full py-2 mt-1 rounded-sm bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('admin.login.demo_btn', 'Remplir automatiquement')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-obsidian-300">
          {t('admin.login.security_notice', "Système sécurisé VIP TADJ. Toute tentative d'accès non autorisée est enregistrée.")}
        </p>
      </div>
    </div>
  );
}
