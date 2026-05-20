import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const CallToAction = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const cms = useContent('cta_banner') || {};
  const t = useT();

  return (
    <section ref={ref} className="relative py-20 md:py-32 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-110 md:scale-125"
        style={{ backgroundImage: 'url("/parallax-bg.png")', y }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-slate-900/75"></div>
      </motion.div>

      <div className="relative z-10 text-center px-5 max-w-3xl mx-auto">
        <AnimatedSection>
          {cms.title && (
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 md:mb-6 leading-tight">
              {cms.title}
            </h2>
          )}
          {cms.subtitle && (
            <p className="text-base md:text-xl text-slate-100 mb-6 md:mb-10 leading-relaxed">
              {cms.subtitle}
            </p>
          )}
          <a href="#kontakt-form"
            className="btn-primary w-full md:w-auto md:px-10 py-4 text-base md:text-lg shadow-xl shadow-orange-500/30 hover:-translate-y-0.5 transition-transform">
            {cms.cta_label || t('cta.book_term')}
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CallToAction;
