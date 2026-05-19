import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const CallToAction = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const cms = useContent('cta_banner') || {};
  const t = useT();

  return (
    <section ref={ref} className="relative py-32 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-125"
        style={{ backgroundImage: 'url("/parallax-bg.png")', y }}
      >
        <div className="absolute inset-0 bg-slate-900/75"></div>
      </motion.div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <AnimatedSection>
          {cms.title && <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">{cms.title}</h2>}
          {cms.subtitle && <p className="text-lg md:text-xl text-slate-100 mb-10">{cms.subtitle}</p>}
          <a href="#kontakt-form" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-lg shadow-lg hover:shadow-orange-500/30 transition-all text-lg transform hover:-translate-y-1 cursor-pointer">
            {cms.cta_label || t('cta.book_term')}
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CallToAction;
