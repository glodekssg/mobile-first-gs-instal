import { useEffect, useState } from 'react';
import { Phone, Calendar } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

/**
 * Floating sticky CTA na mobile dla publicznej strony — "Zadzwoń" + "Umów".
 * Pojawia się po przewinięciu poniżej hero.
 */
export default function MobileStickyCta() {
  const contact = useContent('contact_info');
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const phone = contact?.phone || contact?.phone_grzegorz || contact?.phone_kamil;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null;

  return (
    <div
      className={`md:hidden fixed left-0 right-0 z-40 transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      aria-hidden={!visible}
    >
      <div className="mx-3 flex gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200">
        {phoneHref && (
          <a href={phoneHref} className="btn-secondary flex-1 py-3 text-sm font-bold">
            <Phone className="w-4 h-4 text-orange-500" />
            <span className="truncate">{t('header.book')?.length > 12 ? phone : phone}</span>
          </a>
        )}
        <a href="#kontakt-form" className="btn-primary flex-1 py-3 text-sm font-bold">
          <Calendar className="w-4 h-4" />
          {t('header.book')}
        </a>
      </div>
    </div>
  );
}
