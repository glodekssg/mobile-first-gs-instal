import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, LogIn } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contact = useContent('contact_info');
  const t = useT();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: t('header.about'), href: '#o-nas' },
    { name: t('header.services'), href: '#uslugi' },
    { name: t('header.team'), href: '#zespol' },
    { name: t('header.contact'), href: '#kontakt-form' },
  ];

  const phone = contact?.phone || contact?.phone_grzegorz || contact?.phone_kamil;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : '#kontakt-form';

  return (
    <header
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${isScrolled || mobileMenuOpen ? 'bg-white shadow-md' : 'bg-transparent'}`}
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-200 ${isScrolled || mobileMenuOpen ? 'py-2.5' : 'py-3 md:py-5'}`}>
          <Link
            to="/"
            className={`text-xl md:text-2xl font-black tracking-tight ${isScrolled || mobileMenuOpen ? 'text-slate-900' : 'text-white'}`}
            aria-label="GS Instal — strona główna"
          >
            GS INSTAL<span className="text-orange-500">.</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-5">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                className={`font-medium hover:text-orange-500 transition-colors ${isScrolled ? 'text-slate-700' : 'text-slate-100'}`}>
                {link.name}
              </a>
            ))}
            <LanguageSwitcher dark={isScrolled} />
            <Link to="/login"
              className={`flex items-center font-medium transition-colors hover:text-orange-500 ${isScrolled ? 'text-slate-700' : 'text-slate-100'}`}>
              <LogIn className="w-4 h-4 mr-1.5" />
              {t('header.panel')}
            </Link>
            {phone && (
              <a href={phoneHref} className="btn-primary">
                <Phone className="w-4 h-4" />
                {phone}
              </a>
            )}
          </nav>

          {/* Mobile actions: phone-icon CTA + menu */}
          <div className="md:hidden flex items-center gap-1.5">
            {phone && (
              <a
                href={phoneHref}
                aria-label={`Zadzwoń ${phone}`}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-orange-500 text-white shadow-md active:scale-95 transition-transform"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
            <LanguageSwitcher dark={isScrolled || mobileMenuOpen} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`inline-flex items-center justify-center w-11 h-11 rounded-full ${(isScrolled || mobileMenuOpen) ? 'text-slate-900 active:bg-slate-100' : 'text-white active:bg-white/10'}`}
              aria-label={mobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 shadow-xl overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3.5 text-base font-medium text-slate-900 hover:text-orange-500 active:bg-slate-50 rounded-xl"
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3.5 text-base font-medium text-slate-900 hover:text-orange-500 active:bg-slate-50 rounded-xl"
              >
                <LogIn className="w-5 h-5 text-orange-500" />
                {t('header.panel')}
              </Link>
              <a
                href="#kontakt-form"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full mt-3 py-3.5"
              >
                {t('header.book')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
