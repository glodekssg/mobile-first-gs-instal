import React, { useEffect } from 'react';
import { fetchContent, useContent } from '../lib/cms';
import { useLang } from '../lib/i18n';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import CallToAction from '../components/CallToAction';
import About from '../components/About';
import Team from '../components/Team';
import ContactForm from '../components/ContactForm';
import ChimneySweepGame from '../components/ChimneySweepGame';
import Footer from '../components/Footer';
import MobileStickyCta from '../components/MobileStickyCta';

function setMeta(name, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function PublicSite() {
  const [lang] = useLang();
  useEffect(() => { fetchContent(lang).catch(console.error); }, [lang]);
  const seo = useContent('seo');
  useEffect(() => {
    if (seo?.page_title) document.title = seo.page_title;
    if (seo?.meta_description) setMeta('description', seo.meta_description);
    if (seo?.keywords) setMeta('keywords', seo.keywords);
  }, [seo]);
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-500 selection:text-white">
      <a href="#main-content" className="skip-link">Przejdź do treści / Skip to content</a>
      <Header />
      <main id="main-content" tabIndex="-1">
        <Hero />
        <Services />
        <About />
        <Team />
        <CallToAction />
        <ContactForm />
        <ChimneySweepGame />
      </main>
      <Footer />
      <MobileStickyCta />
    </div>
  );
}
