import React from 'react';
import { AnimatedSection } from './AnimatedSection';
import { CheckCircle } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const About = () => {
  const cms = useContent('about') || {};
  const t = useT();

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden" id="o-nas" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          <AnimatedSection animation="fadeInRight" className="order-1 lg:order-2 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/team.png"
                alt={cms.image_alt || 'Zespół GS Instal'}
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>
            {(cms.badge_number || cms.badge_text) && (
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-orange-500 text-white p-4 md:p-6 rounded-xl shadow-xl">
                <div className="text-3xl md:text-4xl font-bold mb-1">{cms.badge_number}</div>
                <div className="text-xs md:text-sm uppercase tracking-wider font-semibold">{cms.badge_text}</div>
              </div>
            )}
          </AnimatedSection>

          <AnimatedSection animation="fadeInLeft" className="order-2 lg:order-1">
            {cms.eyebrow && <p className="text-orange-600 font-bold uppercase tracking-wider text-xs md:text-sm mb-2">{cms.eyebrow}</p>}
            {cms.title && <h2 id="about-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 md:mb-6 leading-tight">{cms.title}</h2>}
            {cms.body && <p className="text-base md:text-lg text-slate-600 mb-5 md:mb-6 leading-relaxed">{cms.body}</p>}
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {(cms.benefits || []).map((benefit, idx) => (
                <li key={idx} className="flex items-start text-slate-700 font-medium">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <a
              href="#kontakt-form"
              className="btn-primary w-full md:w-auto py-4 md:py-3 md:px-8"
            >
              {t('about.learn_more')}
            </a>
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
};

export default About;
