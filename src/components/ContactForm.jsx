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
    service_type: '', message: ''
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
    <section className="py-24 bg-surface" id="kontakt-form" aria-labelledby="contact-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-orange-600 font-bold uppercase tracking-wider text-sm mb-2">{t('contact.eyebrow')}</p>
          <h2 id="contact-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{t('contact.title')}</h2>
          <p className="text-slate-700 mt-2">{t('contact.subtitle')}</p>
          <div className="w-24 h-1 bg-orange-500 mx-auto rounded mt-4" aria-hidden="true"></div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          {profile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              👋 {t('contact.logged_in_as')} <strong>{profile.full_name}</strong>. {t('contact.prefilled')}
              {profile.role === 'mieszkaniec' && (
                <div className="text-xs mt-1"><a href="/panel/mieszkaniec/termin" className="underline">{t('contact.book_panel')}</a>.</div>
              )}
            </div>
          )}
          {status === 'success' ? (
            <div className="text-center py-12" role="status" aria-live="polite">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('contact.success_title')}</h3>
              <p className="text-slate-600">{t('contact.success_body')}</p>
              <button onClick={() => { setStatus('idle'); }}
                className="mt-8 text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                {t('contact.send_another')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-2">{t('contact.name')}</label>
                  <input type="text" id="full_name" required
                    value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">{t('contact.phone')}</label>
                  <input type="tel" id="phone" required
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">{t('contact.email')}</label>
                <input type="email" id="email"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
              </div>

              <div>
                <label htmlFor="service_type" className="block text-sm font-medium text-slate-700 mb-2">{t('contact.service')}</label>
                <select id="service_type" required
                  value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all">
                  <option value="" disabled>{t('contact.service')}</option>
                  {cmsServices.map(s => (
                    <option key={s.title} value={s.title}>{s.title}</option>
                  ))}
                  <option value="inne">{t('svc.inne')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">{t('contact.message')}</label>
                <textarea id="message" rows="4"
                  value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                  placeholder={t('contact.message_ph')} />
              </div>

              {err && <div className="text-rose-600 text-sm">{err}</div>}

              <button type="submit" disabled={status === 'loading'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-70">
                {status === 'loading' ? t('contact.sending') : (<>{t('contact.submit')} <Send className="w-5 h-5 ml-2" /></>)}
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
