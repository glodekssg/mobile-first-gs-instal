import React from 'react';
import { AnimatedSection } from './AnimatedSection';
import { Phone, Mail, User } from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const Team = () => {
  const team = useContent('team');
  const t = useT();
  if (!team || team.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white" id="zespol" aria-labelledby="team-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <p className="text-orange-600 font-bold uppercase tracking-wider text-xs md:text-sm mb-2">{t('team.eyebrow')}</p>
          <h2 id="team-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 md:mb-4">{t('team.title')}</h2>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded" aria-hidden="true"></div>
        </AnimatedSection>

        <div className={`grid grid-cols-1 gap-4 md:gap-6 ${team.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} max-w-5xl mx-auto`}>
          {team.map((person, i) => (
            <AnimatedSection
              key={i}
              animation="fadeInUp"
              className="bg-slate-50 rounded-2xl p-5 md:p-8 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 md:block">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 md:mb-6">
                  <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{person.name}</h3>
                  {person.role && <p className="text-orange-600 font-semibold text-xs md:text-sm uppercase tracking-wider mb-2 md:mb-4">{person.role}</p>}
                </div>
              </div>
              {person.description && <p className="text-slate-700 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">{person.description}</p>}
              <div className="space-y-2 pt-3 md:pt-4 border-t border-slate-200">
                {person.phone && (
                  <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="flex items-center text-slate-700 hover:text-orange-500 transition-colors py-1">
                    <Phone className="w-4 h-4 mr-3 text-orange-500" />
                    <span>{person.phone}</span>
                  </a>
                )}
                {person.email && (
                  <a href={`mailto:${person.email}`} className="flex items-center text-slate-700 hover:text-orange-500 transition-colors py-1 break-all">
                    <Mail className="w-4 h-4 mr-3 text-orange-500 flex-shrink-0" />
                    <span>{person.email}</span>
                  </a>
                )}
                {!person.phone && !person.email && (
                  <a href="#kontakt-form" className="text-sm text-slate-500 hover:text-orange-500">{t('team.contact_via_form')}</a>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
