import React, { useState, useEffect } from 'react';
import { AnimatedSection } from './AnimatedSection';
import { Send, CheckCircle } from 'lucide-react';
import { getProfile } from '../lib/api';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const ContactForm = () => {
  const t = useT();
  const [status, setStatus] = useState('idle');
  const profile = getProfile();
  const cmsServices = useContent('services') || [];
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    service_type: '', message: '',
  });
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (profile && !form.full_name) {
      setForm(f => ({ ...f, full_name: profile.full_name || '', phone: profile.phone || '', email: profile.email || '' }));
    }
  }, [profile]);

  useEffect(() => {
    const handleSelectService = (e) => {
      setForm(f => ({ ...f, service_type: e.detail }));
    };
    window.addEventListener('select-service', handleSelectService);
    return () => window.removeEventListener('select-service', handleSelectService);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading'); setErr(null);
    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setStatus('success');
    } catch (e) {
      setErr(e.message); setStatus('idle');
    }
  };

  return (
    <section className="py-16 md:py-24 bg-surface" id="kontakt-form" aria-labelledby="contact-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <p className="text-orange-600 font-bold uppercase tracking-wider text-xs md:text-sm mb-2">{t('contact.eyebrow')}</p>
          <h2 id="contact-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{t('contact.title')}</h2>
          <p className="text-slate-700 mt-2 text-base">{t('contact.subtitle')}</p>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded mt-4" aria-hidden="true"></div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-5 md:p-8">
          {profile && status !== 'success' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              👋 {t('contact.logged_in_as')} <strong>{profile.full_name}</strong>. {t('contact.prefilled')}
              {profile.role === 'mieszkaniec' && (
                <div className="text-xs mt-1"><a href="/panel/mieszkaniec/termin" className="underline">{t('contact.book_panel')}</a>.</div>
              )}
            </div>
          )}
          {status === 'success' ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{t('contact.success_title')}</h3>
              <p className="text-slate-600">{t('contact.success_body')}</p>
              <button
                onClick={() => { setStatus('idle'); }}
                className="btn-secondary mt-6 w-full md:w-auto"
              >
                {t('contact.send_another')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="form-label">{t('contact.name')}</label>
                <input
                  type="text"
                  id="full_name"
                  autoComplete="name"
                  required
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="phone" className="form-label">{t('contact.phone')}</label>
                <input
                  type="tel"
                  id="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="email" className="form-label">{t('contact.email')}</label>
                <input
                  type="email"
                  id="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="service_type" className="form-label">{t('contact.service')}</label>
                <select
                  id="service_type"
                  required
                  value={form.service_type}
                  onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                  className="form-input"
                >
                  <option value="" disabled>{t('contact.service')}</option>
                  {cmsServices.map(s => (
                    <option key={s.title} value={s.title}>{s.title}</option>
                  ))}
                  <option value="inne">{t('svc.inne')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="form-label">{t('contact.message')}</label>
                <textarea
                  id="message"
                  rows="4"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="form-input resize-none"
                  placeholder={t('contact.message_ph')}
                />
              </div>

              {err && <div className="text-rose-600 text-sm" role="alert">{err}</div>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full py-4 text-base disabled:opacity-70"
              >
                {status === 'loading' ? t('contact.sending') : (<>
                  {t('contact.submit')}
                  <Send className="w-5 h-5" />
                </>)}
              </button>

              <p className="text-xs text-slate-500 text-center">{t('contact.consent')}</p>
            </form>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ContactForm;
