import React from 'react';
import { AnimatedSection } from './AnimatedSection';
import { CheckCircle } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const About = () => {
  const cms = useContent('about') || {};
  const t = useT();

  return (
    <section className="py-24 bg-white overflow-hidden" id="o-nas" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <AnimatedSection animation="fadeInLeft" className="order-2 lg:order-1">
            {cms.eyebrow && <p className="text-orange-600 font-bold uppercase tracking-wider text-sm mb-2">{cms.eyebrow}</p>}
            {cms.title && <h2 id="about-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">{cms.title}</h2>}
            {cms.body && <p className="text-lg text-slate-600 mb-6 leading-relaxed">{cms.body}</p>}
            <ul className="space-y-4 mb-8">
              {(cms.benefits || []).map((benefit, idx) => (
                <li key={idx} className="flex items-center text-slate-700 font-medium">
                  <CheckCircle className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
            <a href="#kontakt-form" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              {t('about.learn_more')}
            </a>
          </AnimatedSection>

          <AnimatedSection animation="fadeInRight" className="order-1 lg:order-2 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img src="/team.png" alt="Team" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>
            {(cms.badge_number || cms.badge_text) && (
              <div className="absolute -bottom-6 -left-6 bg-orange-500 text-white p-6 rounded-xl shadow-xl hidden md:block">
                <div className="text-4xl font-bold mb-1">{cms.badge_number}</div>
                <div className="text-sm uppercase tracking-wider font-semibold">{cms.badge_text}</div>
              </div>
            )}
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
};

export default About;
