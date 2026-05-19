// Dynamiczny układ kafelków usług — gwarantuje pełne wypełnienie gridu bez pustych pól.
// WCAG: równe wysokości, czytelne kontrasty, sensowna hierarchia nagłówków, focus-visible.
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection';
import * as Icons from 'lucide-react';
import { useContent } from '../lib/cms';
import { useT } from '../lib/i18n';

const DEFAULTS = [
  { title: 'Okresowe kontrole', desc: 'Regularne kontrole przewodów.', icon: 'ShieldCheck' },
  { title: 'Wkłady kominowe', desc: 'Montaż wkładów.', icon: 'Wrench' },
  { title: 'Nasady kominowe', desc: 'Montaż nasad.', icon: 'Wind' },
];

// =================== ALGORYTM UKŁADU ===================
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
    items.push({
      colStart: (i % cols) + 1,
      rowStart: Math.floor(i / cols) + 1,
      colSpan: 1,
      rowSpan: 1,
    });
  }

  // Wypełnij ostatni rząd rozszerzając jego karty
  const lastRowCount = count % cols || cols;
  if (lastRowCount < cols) {
    const empty = cols - lastRowCount;
    const startIdx = count - lastRowCount;
    let extra = empty;
    let i = 0;
    while (extra > 0) {
      items[startIdx + (i % lastRowCount)].colSpan++;
      extra--;
      i++;
    }
    let c = 1;
    for (let k = startIdx; k < count; k++) {
      items[k].colStart = c;
      c += items[k].colSpan;
    }
  }

  let pattern = count === 1 ? 'hero'
    : count <= 3 ? 'row'
    : count === 4 ? 'quad'
    : count <= 6 ? 'sextet'
    : count === 7 ? 'mag7'
    : count === 8 ? 'octet'
    : count === 9 ? 'square'
    : 'mosaic';

  return { cols, rows, items, pattern };
}

// =================== ANIMACJE (delikatne, respektują prefers-reduced-motion przez CSS) ===================
const ANIMS = {
  hero: i => ({ initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, delay: i * 0.05 } }),
  row: i => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.1 } }),
  quad: i => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: i * 0.08, ease: 'easeOut' } }),
  sextet: i => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.06 } }),
  mag7: i => ({ initial: { opacity: 0, y: 25, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
  octet: i => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.05 } }),
  square: i => ({ initial: { opacity: 0, scale: 0.88 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.45, delay: ((i % 3) + Math.floor(i / 3)) * 0.06 } }),
  mosaic: i => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: Math.min(0.7, i * 0.04) } }),
};

// =================== KARTA — ZAWSZE TEN SAM UKŁAD (vertical) ===================
function ServiceCard({ service, isFeatured, index, pattern }) {
  const Icon = Icons[service.icon] || Icons.Wrench;
  const a = (ANIMS[pattern] || ANIMS.mosaic)(index);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('select-service', { detail: service.title }));
  };

  return (
    <motion.a
      href="#kontakt-form"
      onClick={handleClick}
      initial={a.initial}
      whileInView={a.animate}
      viewport={{ once: true, margin: '-50px' }}
      transition={a.transition}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl
        hover:border-orange-200 transition-shadow duration-300 flex flex-col cursor-pointer text-left
        ${isFeatured ? 'p-8 service-card-featured' : 'p-6'}`}
    >
      <div className={`bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 mb-5
        group-hover:bg-orange-100 transition-colors duration-300
        ${isFeatured ? 'w-20 h-20' : 'w-14 h-14'}`}>
        <Icon
          aria-hidden="true"
          className={`text-orange-600 transition-transform duration-300 group-hover:scale-110
            ${isFeatured ? 'w-12 h-12' : 'w-8 h-8'}`}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className={`font-bold text-slate-900 mb-2 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
          {service.title}
        </h3>
        <p className={`text-slate-700 leading-relaxed flex-1 ${isFeatured ? 'text-base' : 'text-sm'}`}>
          {service.desc}
        </p>
      </div>
    </motion.a>
  );
}

// =================== KOMPONENT GŁÓWNY ===================
const Services = () => {
  const list = useContent('services') || DEFAULTS;
  const t = useT();
  const layout = useMemo(() => calculateLayout(list.length), [list.length]);

  return (
    <section className="py-24 bg-surface" id="uslugi" aria-labelledby="services-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-orange-600 font-bold uppercase tracking-wider text-sm mb-2">
            {t('services.eyebrow')}
          </p>
          <h2 id="services-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            {t('services.title')}
          </h2>
          <div className="w-24 h-1 bg-orange-500 mx-auto rounded" aria-hidden="true"></div>
        </AnimatedSection>

        {/* Mobile (< lg) — pełen 2-kolumnowy grid; ostatnia karta zajmuje 2 kolumny gdy jest nieparzysta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
          {list.map((service, i) => {
            const isOddLast = list.length % 2 === 1 && i === list.length - 1;
            return (
              <div key={i} className={isOddLast ? 'sm:col-span-2' : ''}>
                <ServiceCard service={service} index={i} pattern={layout.pattern} isFeatured={isOddLast} />
              </div>
            );
          })}
        </div>

        {/* Desktop (lg+) — dynamiczny grid z gwarancją pełnego wypełnienia */}
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
                <ServiceCard
                  service={service}
                  isFeatured={isFeatured}
                  index={i}
                  pattern={layout.pattern}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
