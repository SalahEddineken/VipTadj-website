'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';

export interface ProductAccordionsProps {
  product: Product;
  onOpenSizeGuide?: () => void;
}

export function ProductAccordions({
  product,
  onOpenSizeGuide,
}: ProductAccordionsProps) {
  const { t, language } = useLanguage();
  const localizedProduct = getLocalizedProduct(product, language);
  const [openSection, setOpenSection] = useState<string | null>('desc');

  const toggle = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const isShoes = localizedProduct.categoryId === 'shoes';

  return (
    <div className="divide-y divide-sand-200 border-b border-sand-200 text-xs font-sans">
      {/* 1. Description & Coupe */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggle('desc')}
          aria-expanded={openSection === 'desc'}
          aria-controls="accordion-desc"
          className="w-full flex items-center justify-between text-start font-serif uppercase tracking-wider text-sm text-obsidian-950 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded py-1"
        >
          <span>{t('pdp.accordion.description', 'Description & Coupe Sartoriale')}</span>
          <ChevronDown
            className={`w-4 h-4 text-gold-700 transition-transform duration-300 ${
              openSection === 'desc' ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          id="accordion-desc"
          role="region"
          aria-labelledby="accordion-desc"
          className={`grid transition-all duration-300 ease-in-out ${
            openSection === 'desc' ? 'grid-rows-[1fr] opacity-100 pt-3 pb-1' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden space-y-3 text-neutral-600 leading-relaxed font-sans text-xs">
            <p className="whitespace-pre-line">{localizedProduct.description}</p>
            {localizedProduct.materials && (
              <p>
                <strong className="text-obsidian-950">{t('pdp.accordion.materials', 'Matières & Tissage :')}</strong>{' '}
                {localizedProduct.materials}
              </p>
            )}
            {localizedProduct.fit && (
              <p>
                <strong className="text-obsidian-950">{t('pdp.accordion.fit', 'Coupe :')}</strong> {localizedProduct.fit}
              </p>
            )}
            <ul className="list-disc list-inside space-y-1 text-neutral-600 pt-1">
              <li>{t('pdp.accordion.desc_bullet1', 'Confection haut de gamme respectant les règles traditionnelles du sur-mesure.')}</li>
              <li>{t('pdp.accordion.desc_bullet2', 'Finitions soignées à la main et contrôle de qualité avant toute expédition.')}</li>
              <li>{t('pdp.accordion.desc_bullet3', "Tissus et cuirs nobles certifiés d'origine italienne et espagnole.")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Guide des Tailles & Mesures */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggle('sizes')}
          aria-expanded={openSection === 'sizes'}
          aria-controls="accordion-sizes"
          className="w-full flex items-center justify-between text-start font-serif uppercase tracking-wider text-sm text-obsidian-950 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded py-1"
        >
          <span>{t('pdp.accordion.size_guide', 'Guide des Tailles & Mensurations')}</span>
          <ChevronDown
            className={`w-4 h-4 text-gold-700 transition-transform duration-300 ${
              openSection === 'sizes' ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          id="accordion-sizes"
          role="region"
          aria-labelledby="accordion-sizes"
          className={`grid transition-all duration-300 ease-in-out ${
            openSection === 'sizes' ? 'grid-rows-[1fr] opacity-100 pt-3 pb-1' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden space-y-3 text-neutral-600 leading-relaxed font-sans text-xs">
            <p>
              {isShoes
                ? t(
                    'pdp.accordion.sizes_shoes',
                    'Nos souliers taillent selon les normes européennes strictes. Sélectionnez votre pointure standard de ville.'
                  )
                : t(
                    'pdp.accordion.sizes_clothing',
                    "Nos costumes et vestes bénéficient d'une silhouette semi-ajustée (Drop 6/7) mettant en valeur la carrure sans entraver le mouvement."
                  )}
            </p>
            {onOpenSizeGuide && (
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="btn-luxury-outline text-xs uppercase tracking-wider py-2 px-4 inline-block mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {t('pdp.accordion.open_size_guide', 'Ouvrir le Tableau des Mesures Détaillé')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Livraison 58 Wilayas & Retours */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggle('shipping')}
          aria-expanded={openSection === 'shipping'}
          aria-controls="accordion-shipping"
          className="w-full flex items-center justify-between text-start font-serif uppercase tracking-wider text-sm text-obsidian-950 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded py-1"
        >
          <span>{t('pdp.accordion.shipping', 'Livraison 58 Wilayas & Retours')}</span>
          <ChevronDown
            className={`w-4 h-4 text-gold-700 transition-transform duration-300 ${
              openSection === 'shipping' ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          id="accordion-shipping"
          role="region"
          aria-labelledby="accordion-shipping"
          className={`grid transition-all duration-300 ease-in-out ${
            openSection === 'shipping' ? 'grid-rows-[1fr] opacity-100 pt-3 pb-1' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden space-y-2.5 text-neutral-600 leading-relaxed font-sans text-xs">
            <p>
              <strong className="text-obsidian-950">{t('pdp.accordion.carriers_label', 'Transporteurs partenaires :')}</strong>{' '}
              {t('pdp.accordion.carriers_val', 'Yalidine Express & ZR Express.')}
            </p>
            <p>
              <strong className="text-obsidian-950">{t('pdp.accordion.delays_label', "Délais moyens d'acheminement :")}</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 ps-2">
              <li>{t('pdp.accordion.delay_alger', 'Alger & Wilayas limitrophes : 24h à 48h ouvrées.')}</li>
              <li>{t('pdp.accordion.delay_regions', 'Nord, Est & Ouest (Oran, Constantine, Annaba, Sétif...) : 48h à 72h.')}</li>
              <li>{t('pdp.accordion.delay_south', 'Grand Sud (Biskra, Ghardaïa, Ouargla, Béchar...) : 3 à 5 jours ouvrés.')}</li>
            </ul>
            <p>
              <strong className="text-obsidian-950">{t('pdp.accordion.payment_label', 'Modalités de paiement :')}</strong>{' '}
              {t('pdp.accordion.payment_desc', '100% en espèces à la livraison (COD) directement au livreur après inspection du colis.')}
            </p>
            <p>
              <strong className="text-obsidian-950">{t('pdp.accordion.exchange_label', 'Échange de taille garanti sous 48h :')}</strong>{' '}
              {t('pdp.accordion.exchange_desc', 'En cas de taille inadaptée, contactez immédiatement notre service client pour un remplacement rapide.')}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Entretien & Nettoyage */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggle('care')}
          aria-expanded={openSection === 'care'}
          aria-controls="accordion-care"
          className="w-full flex items-center justify-between text-start font-serif uppercase tracking-wider text-sm text-obsidian-950 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded py-1"
        >
          <span>{t('pdp.accordion.care', 'Entretien & Nettoyage Sartorial')}</span>
          <ChevronDown
            className={`w-4 h-4 text-gold-700 transition-transform duration-300 ${
              openSection === 'care' ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          id="accordion-care"
          role="region"
          aria-labelledby="accordion-care"
          className={`grid transition-all duration-300 ease-in-out ${
            openSection === 'care' ? 'grid-rows-[1fr] opacity-100 pt-3 pb-1' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden space-y-2 text-neutral-600 leading-relaxed font-sans text-xs">
            {isShoes ? (
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li>{t('pdp.accordion.care_shoes1', "Nettoyer à l'aide d'un chiffon doux et d'une brosse en crin de cheval.")}</li>
                <li>{t('pdp.accordion.care_shoes2', "Appliquer un cirage nourrissant à la cire d'abeille incolore ou ton sur ton.")}</li>
                <li>{t('pdp.accordion.care_shoes3', "Insérer des embauchoirs en cèdre brut après chaque port pour préserver la forme du cuir.")}</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li>{t('pdp.accordion.care_suits1', "Nettoyage à sec exclusivement auprès d'un teinturier spécialisé en confections nobles.")}</li>
                <li>{t('pdp.accordion.care_suits2', "Ne jamais repasser au contact direct : utiliser une pattemouille et de la vapeur douce.")}</li>
                <li>{t('pdp.accordion.care_suits3', "Conserver sous housse respirante VIP TADJ sur un cintre aux épaules larges.")}</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
