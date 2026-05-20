import React, { useState } from 'react';
import { Mail, MapPin, Phone, ChevronDown } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800 md:border-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full md:hidden flex items-center justify-between py-4 text-left text-white font-semibold"
      >
        <span>{title}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <h3 className="hidden md:block text-lg font-bold text-white mb-6">{title}</h3>
      <div className={`${open ? 'block' : 'hidden'} md:block pb-4 md:pb-0`}>
        {children}
      </div>
    </div>
  );
}

const Footer = () => {
  const cms = useContent('contact_info') || {};
  const t = useT();
  const phone = cms.phone;
  const email = cms.email;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : '#kontakt-form';
  const mailHref = email ? `mailto:${email}` : '#kontakt-form';

  return (
    <footer
      className="bg-slate-900 pt-10 md:pt-16 pb-6"
      id="kontakt"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand block — zawsze widoczny */}
        <div className="mb-6 md:mb-12">
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">
            GS INSTAL<span className="text-orange-500">.</span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">{cms.company || 'GS Instal Sp. z o.o.'}</p>
          <p className="text-slate-400 leading-relaxed text-sm max-w-md">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Mobile: accordion; Desktop: 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mb-6 md:mb-12">
          <Section title={t('footer.quick_links')}>
            <ul className="space-y-3">
              <li><a href="#o-nas" className="text-slate-400 hover:text-orange-500 transition-colors block py-1">{t('footer.about_company')}</a></li>
              <li><a href="#uslugi" className="text-slate-400 hover:text-orange-500 transition-colors block py-1">{t('footer.chimney_services')}</a></li>
              <li><a href="#uslugi" className="text-slate-400 hover:text-orange-500 transition-colors block py-1">{t('footer.gas_installations')}</a></li>
              <li><a href="#kontakt-form" className="text-slate-400 hover:text-orange-500 transition-colors block py-1">{t('footer.book_visit')}</a></li>
            </ul>
          </Section>

          <Section title={t('footer.contact')} defaultOpen>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0 mt-1" />
                <span className="text-slate-400 text-sm">
                  {cms.address_line_1 || 'ul. Aleja Legionów 17'}<br />
                  {cms.address_line_2 || '08-400 Garwolin'}
                  {cms.region && <><br /><span className="text-xs text-slate-500">{cms.region}</span></>}
                </span>
              </li>
              {phone && (
                <li className="flex items-center">
                  <Phone className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={phoneHref} className="text-slate-300 hover:text-white transition-colors">{phone}</a>
                </li>
              )}
              {cms.phone_grzegorz && (
                <li className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={`tel:${cms.phone_grzegorz.replace(/\s/g, '')}`} className="text-slate-300 hover:text-white transition-colors">
                    Grzegorz: {cms.phone_grzegorz}
                  </a>
                </li>
              )}
              {cms.phone_kamil && (
                <li className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={`tel:${cms.phone_kamil.replace(/\s/g, '')}`} className="text-slate-300 hover:text-white transition-colors">
                    Kamil: {cms.phone_kamil}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-center">
                  <Mail className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={mailHref} className="text-slate-300 hover:text-white transition-colors break-all">{email}</a>
                </li>
              )}
            </ul>
          </Section>

          <Section title={t('footer.hours')}>
            <ul className="space-y-2 text-slate-400 text-sm">
              {(cms.hours || []).map((h, i) => (
                <li key={i} className={`flex justify-between ${h.hours === 'Zamknięte' ? 'text-orange-500' : ''}`}>
                  <span>{h.day}:</span> <span>{h.hours}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {(cms.nip || cms.regon || cms.krs) && (
          <div className="border-t border-slate-800 pt-4 md:pt-6 mb-4 md:mb-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              {cms.nip && <span>NIP: <strong className="text-slate-400">{cms.nip}</strong></span>}
              {cms.regon && <span>REGON: <strong className="text-slate-400">{cms.regon}</strong></span>}
              {cms.krs && <span>KRS: <strong className="text-slate-400">{cms.krs}</strong></span>}
              {cms.bank_account && <span>{cms.bank_name || 'Bank'}: <strong className="text-slate-400">{cms.bank_account}</strong></span>}
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 pt-5 md:pt-8 flex flex-col md:flex-row md:justify-between md:items-center text-center md:text-left">
          <p className="text-slate-500 text-xs md:text-sm mb-3 md:mb-0">
            &copy; {new Date().getFullYear()} {cms.company || 'GS Instal Sp. z o.o.'} {t('footer.copyright')}
          </p>
          <div className="flex justify-center md:justify-end space-x-6 text-xs md:text-sm">
            <a href={`${mailHref}${mailHref.startsWith('mailto:') ? '?subject=Privacy' : ''}`} className="text-slate-500 hover:text-white transition-colors">{t('footer.privacy')}</a>
            <a href={`${mailHref}${mailHref.startsWith('mailto:') ? '?subject=Terms' : ''}`} className="text-slate-500 hover:text-white transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
