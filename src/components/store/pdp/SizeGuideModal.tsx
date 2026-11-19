'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export function SizeGuideModal({ isOpen, onClose, category }: SizeGuideModalProps) {
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isShoes = category === 'shoes' || category === 'chaussures';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-ivory border border-sand-300 shadow-2xl max-w-2xl w-full p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-sand-200 mb-6">
          <h3 className="luxury-serif-title text-xl text-obsidian-950">
            {isShoes
              ? t('pdp.size_guide.title_shoes', 'Guide des Pointures Souliers')
              : t('pdp.size_guide.title_suits', 'Guide des Tailles Vêtements')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center text-obsidian-800 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={t('pdp.size_guide.close_btn', 'Fermer le guide')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isShoes ? (
          <div className="space-y-6">
            <p className="text-xs text-neutral-600 font-sans leading-relaxed text-start">
              {t(
                'pdp.size_guide.shoes_advice',
                'Nos souliers VIP TADJ sont montés sur des formes italiennes et espagnoles standards. Nous recommandons de sélectionner votre pointure habituelle.'
              )}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start font-sans border border-sand-200">
                <thead className="bg-sand-100 text-obsidian-950 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_eu', 'EU')}</th>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_uk', 'UK')}</th>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_us', 'US')}</th>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_foot_cm', 'Longueur Pied (cm)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 text-neutral-700 tabular-nums">
                  <tr><td className="py-2 px-3">39</td><td className="py-2 px-3">5.5</td><td className="py-2 px-3">6.5</td><td className="py-2 px-3">25.0</td></tr>
                  <tr><td className="py-2 px-3">40</td><td className="py-2 px-3">6.5</td><td className="py-2 px-3">7.5</td><td className="py-2 px-3">25.7</td></tr>
                  <tr><td className="py-2 px-3">41</td><td className="py-2 px-3">7.5</td><td className="py-2 px-3">8.5</td><td className="py-2 px-3">26.3</td></tr>
                  <tr><td className="py-2 px-3">42</td><td className="py-2 px-3">8.0</td><td className="py-2 px-3">9.0</td><td className="py-2 px-3">27.0</td></tr>
                  <tr><td className="py-2 px-3">43</td><td className="py-2 px-3">9.0</td><td className="py-2 px-3">10.0</td><td className="py-2 px-3">27.7</td></tr>
                  <tr><td className="py-2 px-3">44</td><td className="py-2 px-3">9.5</td><td className="py-2 px-3">10.5</td><td className="py-2 px-3">28.3</td></tr>
                  <tr><td className="py-2 px-3">45</td><td className="py-2 px-3">10.5</td><td className="py-2 px-3">11.5</td><td className="py-2 px-3">29.0</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-neutral-600 font-sans leading-relaxed text-start">
              {t(
                'pdp.size_guide.suits_advice',
                'Nos vêtements et vestes présentent une coupe moderne équilibrant aisance et tombé impeccable. Mesurez votre tour de poitrine à l’endroit le plus large.'
              )}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start font-sans border border-sand-200">
                <thead className="bg-sand-100 text-obsidian-950 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_size_standard', 'Taille')}</th>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_chest_cm', 'Tour Poitrine (cm)')}</th>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_waist_cm', 'Tour Taille (cm)')}</th>
                    <th className="py-2.5 px-3 border-b border-sand-200 text-start">{t('pdp.size_guide.th_jacket_length_cm', 'Longueur Veste (cm)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 text-neutral-700 tabular-nums">
                  <tr><td className="py-2 px-3 font-semibold text-obsidian-950">S</td><td className="py-2 px-3">94 - 97</td><td className="py-2 px-3">82 - 85</td><td className="py-2 px-3">74</td></tr>
                  <tr><td className="py-2 px-3 font-semibold text-obsidian-950">M</td><td className="py-2 px-3">98 - 101</td><td className="py-2 px-3">86 - 89</td><td className="py-2 px-3">75</td></tr>
                  <tr><td className="py-2 px-3 font-semibold text-obsidian-950">L</td><td className="py-2 px-3">102 - 105</td><td className="py-2 px-3">90 - 94</td><td className="py-2 px-3">76</td></tr>
                  <tr><td className="py-2 px-3 font-semibold text-obsidian-950">XL</td><td className="py-2 px-3">106 - 109</td><td className="py-2 px-3">95 - 99</td><td className="py-2 px-3">77</td></tr>
                  <tr><td className="py-2 px-3 font-semibold text-obsidian-950">XXL</td><td className="py-2 px-3">110 - 113</td><td className="py-2 px-3">100 - 104</td><td className="py-2 px-3">78</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
