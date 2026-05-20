// Mobile-first: na telefonie pojedynczy stack (1 kolumna pełnoekranowa) z karty-akcji.
// Na desktopie dynamiczny grid z gwarancją pełnego wypełnienia.
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import * as Icons from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const DEFAULTS = [
  { title: 'Okresowe kontrole', desc: 'Regularne kontrole przewodów.', icon: 'ShieldCheck' },
  { title: 'Wkłady kominowe', desc: 'Montaż wkładów.', icon: 'Wrench' },
  { title: 'Nasady kominowe', desc: 'Montaż nasad.', icon: 'Wind' },
];

// Desktop grid layout
function calculateLayout(count) {
  if (count <= 0) return { cols: 1, rows: 0, items: [], pattern: 'empty' };
  let cols;
  if (count === 1) cols = 1;
  else if (count === 2) cols = 2;
  else if (count === 3) cols = 3;
  else if (count === 4) cols = 2;
  else if (count <= 6) cols = 3;
  else if (count <= 8) cols = 4;
  else if (count <= 12) cols = 4;
  else if (count <= 16) cols = 4;
  else cols = Math.min(6, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ colStart: (i % cols) + 1, rowStart: Math.floor(i / cols) + 1, colSpan: 1, rowSpan: 1 });
  }
  const lastRowCount = count % cols || cols;
  if (lastRowCount < cols) {
    const empty = cols - lastRowCount;
    const startIdx = count - lastRowCount;
    let extra = empty, i = 0;
    while (extra > 0) { items[startIdx + (i % lastRowCount)].colSpan++; extra--; i++; }
    let c = 1;
    for (let k = startIdx; k < count; k++) { items[k].colStart = c; c += items[k].colSpan; }
  }
  return { cols, rows, items };
}

function ServiceCardMobile({ service, index }) {
  const Icon = Icons[service.icon] || Icons.Wrench;
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('select-service', { detail: service.title }));
  };
  return (
    <motion.a
      href="#kontakt-form"
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: Math.min(0.4, index * 0.05) }}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 p-4"
    >
      <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-7 h-7 text-orange-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 text-base">{service.title}</h3>
        <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">{service.desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" aria-hidden="true" />
    </motion.a>
  );
}

function ServiceCardDesktop({ service, isFeatured, index }) {
  const Icon = Icons[service.icon] || Icons.Wrench;
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('select-service', { detail: service.title }));
  };
  return (
    <motion.a
      href="#kontakt-form"
      onClick={handleClick}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: Math.min(0.6, index * 0.05) }}
      whileHover={{ y: -4 }}
      className={`group h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-shadow duration-300 flex flex-col cursor-pointer text-left ${isFeatured ? 'p-8 service-card-featured' : 'p-6'}`}
    >
      <div className={`bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 mb-5 group-hover:bg-orange-100 transition-colors duration-300 ${isFeatured ? 'w-20 h-20' : 'w-14 h-14'}`}>
        <Icon aria-hidden="true" className={`text-orange-600 transition-transform duration-300 group-hover:scale-110 ${isFeatured ? 'w-12 h-12' : 'w-8 h-8'}`} />
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className={`font-bold text-slate-900 mb-2 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>{service.title}</h3>
        <p className={`text-slate-700 leading-relaxed flex-1 ${isFeatured ? 'text-base' : 'text-sm'}`}>{service.desc}</p>
      </div>
    </motion.a>
  );
}

const Services = () => {
  const list = useContent('services') || DEFAULTS;
  const t = useT();
  const layout = useMemo(() => calculateLayout(list.length), [list.length]);

  return (
    <section className="py-16 md:py-24 bg-surface" id="uslugi" aria-labelledby="services-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <p className="text-orange-600 font-bold uppercase tracking-wider text-xs md:text-sm mb-2">
            {t('services.eyebrow')}
          </p>
          <h2 id="services-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 md:mb-4">
            {t('services.title')}
          </h2>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded" aria-hidden="true"></div>
        </AnimatedSection>

        {/* Mobile (< md) — pełnoszerokie karty */}
        <div className="space-y-3 md:hidden">
          {list.map((service, i) => (
            <ServiceCardMobile key={i} service={service} index={i} />
          ))}
        </div>

        {/* Tablet (md..lg) — 2 kolumny */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
          {list.map((service, i) => (
            <ServiceCardDesktop key={i} service={service} index={i} isFeatured={false} />
          ))}
        </div>

        {/* Desktop (lg+) */}
        <div
          className="hidden lg:grid gap-5"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            gridAutoRows: '1fr',
          }}
        >
          {list.map((service, i) => {
            const pos = layout.items[i];
            if (!pos) return null;
            const isFeatured = pos.colSpan >= 3 || (pos.colSpan >= 2 && pos.rowSpan >= 2);
            return (
              <div
                key={i}
                style={{
                  gridColumn: `${pos.colStart} / span ${pos.colSpan}`,
                  gridRow: `${pos.rowStart} / span ${pos.rowSpan}`,
                  minHeight: '220px',
                }}
              >
                <ServiceCardDesktop service={service} isFeatured={isFeatured} index={i} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
