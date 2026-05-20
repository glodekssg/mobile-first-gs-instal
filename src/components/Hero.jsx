import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Phone, Calendar } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const cms = useContent('hero');
  const contact = useContent('contact_info');
  const t = useT();

  const title = cms?.title || t('hero.default_title');
  const subtitle = cms?.subtitle || '';
  const ctaLabel = cms?.cta_label || t('hero.contact_us');
  const ctaAnchor = cms?.cta_anchor || '#kontakt-form';
  const phone = contact?.phone || contact?.phone_grzegorz || contact?.phone_kamil;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null;

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] md:h-screen md:min-h-[640px] flex items-end md:items-center justify-center overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/hero-bg.png")', y }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/70 to-slate-900/90 md:bg-slate-900/70"></div>
      </motion.div>

      <div
        className="relative z-10 w-full px-5 pb-12 md:pb-0 md:px-4 md:text-center md:max-w-4xl md:mx-auto"
        style={{ paddingTop: 'calc(var(--safe-top) + 96px)' }}
      >
        <motion.h1
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            className="text-base sm:text-lg md:text-xl text-slate-200 mb-6 md:mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            {subtitle}
          </motion.p>
        )}

        <motion.div
          className="flex flex-col gap-3 md:flex-row md:justify-center md:gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a
            href={ctaAnchor}
            className="btn-primary w-full md:w-auto py-4 text-base md:text-lg shadow-xl shadow-orange-500/30"
          >
            <Calendar className="w-5 h-5" />
            {ctaLabel}
          </a>
          {phoneHref && (
            <a
              href={phoneHref}
              className="btn-secondary w-full md:w-auto py-4 text-base md:text-lg bg-white/95 backdrop-blur-sm"
            >
              <Phone className="w-5 h-5 text-orange-500" />
              {phone}
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
