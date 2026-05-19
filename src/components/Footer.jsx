import React from 'react';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const Footer = () => {
  const cms = useContent('contact_info') || {};
  const t = useT();
  const phone = cms.phone;
  const email = cms.email;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : '#kontakt-form';
  const mailHref = email ? `mailto:${email}` : '#kontakt-form';

  return (
    <footer className="bg-slate-900 pt-16 pb-8" id="kontakt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              GS INSTAL<span className="text-orange-500">.</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">{cms.company || 'GS Instal Sp. z o.o.'}</p>
            <p className="text-slate-400 mb-6 leading-relaxed text-sm">
              {t('footer.tagline')}
            </p>
            {email && (
              <div className="flex space-x-4">
                <a href={mailHref} className="text-slate-400 hover:text-orange-500 transition-colors" aria-label="Email">
                  <MessageSquare className="w-6 h-6" />
                </a>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">{t('footer.quick_links')}</h3>
            <ul className="space-y-3">
              <li><a href="#o-nas" className="text-slate-400 hover:text-orange-500 transition-colors">{t('footer.about_company')}</a></li>
              <li><a href="#uslugi" className="text-slate-400 hover:text-orange-500 transition-colors">{t('footer.chimney_services')}</a></li>
              <li><a href="#uslugi" className="text-slate-400 hover:text-orange-500 transition-colors">{t('footer.gas_installations')}</a></li>
              <li><a href="#kontakt-form" className="text-slate-400 hover:text-orange-500 transition-colors">{t('footer.book_visit')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">{t('footer.contact')}</h3>
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
                  <a href={phoneHref} className="text-slate-400 hover:text-white transition-colors">{phone}</a>
                </li>
              )}
              {cms.phone_grzegorz && (
                <li className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={`tel:${cms.phone_grzegorz.replace(/\s/g, '')}`} className="text-slate-400 hover:text-white transition-colors">
                    Grzegorz: {cms.phone_grzegorz}
                  </a>
                </li>
              )}
              {cms.phone_kamil && (
                <li className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={`tel:${cms.phone_kamil.replace(/\s/g, '')}`} className="text-slate-400 hover:text-white transition-colors">
                    Kamil: {cms.phone_kamil}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-center">
                  <Mail className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                  <a href={mailHref} className="text-slate-400 hover:text-white transition-colors">{email}</a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">{t('footer.hours')}</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              {(cms.hours || []).map((h, i) => (
                <li key={i} className={`flex justify-between ${h.hours === 'Zamknięte' ? 'text-orange-500' : ''}`}>
                  <span>{h.day}:</span> <span>{h.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(cms.nip || cms.regon || cms.krs) && (
          <div className="border-t border-slate-800 pt-6 mb-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              {cms.nip && <span>NIP: <strong className="text-slate-400">{cms.nip}</strong></span>}
              {cms.regon && <span>REGON: <strong className="text-slate-400">{cms.regon}</strong></span>}
              {cms.krs && <span>KRS: <strong className="text-slate-400">{cms.krs}</strong></span>}
              {cms.bank_account && <span>{cms.bank_name || 'Bank'}: <strong className="text-slate-400">{cms.bank_account}</strong></span>}
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm text-center md:text-left mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {cms.company || 'GS Instal Sp. z o.o.'} {t('footer.copyright')}
          </p>
          <div className="flex space-x-6 text-sm">
            <a href={`${mailHref}${mailHref.startsWith('mailto:') ? '?subject=Privacy' : ''}`} className="text-slate-500 hover:text-white transition-colors">{t('footer.privacy')}</a>
            <a href={`${mailHref}${mailHref.startsWith('mailto:') ? '?subject=Terms' : ''}`} className="text-slate-500 hover:text-white transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
