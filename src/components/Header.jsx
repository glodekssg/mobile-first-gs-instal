import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, LogIn, Calendar } from 'lucide-react';
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

  const navLinks = [
    { name: t('header.about'), href: '#o-nas' },
    { name: t('header.services'), href: '#uslugi' },
    { name: t('header.team'), href: '#zespol' },
    { name: t('header.contact'), href: '#kontakt-form' },
  ];

  const phone = contact?.phone || contact?.phone_grzegorz || contact?.phone_kamil;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : '#kontakt-form';

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className={`text-2xl font-black tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
              GS INSTAL<span className="text-orange-500">.</span>
            </Link>
          </div>

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
            {phone ? (
              <a href={phoneHref}
                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-md font-semibold transition-colors shadow-sm hover:shadow-md">
                <Phone className="w-4 h-4 mr-2" />
                {phone}
              </a>
            ) : (
              <a href="#kontakt-form"
                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-md font-semibold transition-colors shadow-sm hover:shadow-md">
                <Calendar className="w-4 h-4 mr-2" />
                {t('header.book')}
              </a>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher dark={isScrolled} />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${isScrolled ? 'text-slate-900' : 'text-white'}`} aria-label={t('header.menu_open')}>
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 shadow-xl overflow-hidden">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-slate-900 hover:text-orange-500 hover:bg-slate-50 rounded-md">
                  {link.name}
                </a>
              ))}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-slate-900 hover:text-orange-500 hover:bg-slate-50 rounded-md">
                {t('header.panel')}
              </Link>
              {phone ? (
                <a href={phoneHref} className="mt-4 flex justify-center items-center bg-orange-500 text-white px-5 py-3 rounded-md font-semibold">
                  <Phone className="w-5 h-5 mr-2" />
                  {phone}
                </a>
              ) : (
                <a href="#kontakt-form" onClick={() => setMobileMenuOpen(false)}
                  className="mt-4 flex justify-center items-center bg-orange-500 text-white px-5 py-3 rounded-md font-semibold">
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('header.book')}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
