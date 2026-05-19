// Uzupełnienie CMS realnymi danymi GS Instal Sp. z o.o.
// Źródła: KRS 0000999191, NIP 8262216780, REGON 523489810
// Wspólnicy: Grzegorz Sitek (50%) + Kamil Głodek (50%)
import db from './index.js';

const admin = db.prepare("SELECT id FROM profiles WHERE role='admin' LIMIT 1").get();
const adminId = admin?.id || 1;

const content = {
  hero: {
    title: 'Kominiarz w Garwolinie i okolicach',
    subtitle: 'GS Instal Sp. z o.o. — okresowe kontrole przewodów kominowych, czyszczenie, montaż wkładów i nasad, kontrola instalacji gazowej, inspekcje kamerą, opinie kominiarskie.',
    cta_label: 'Umów wizytę',
    cta_anchor: '#kontakt-form',
  },
  services: [
    { title: 'Okresowe kontrole przewodów', desc: 'Regularne kontrole przewodów dymowych, spalinowych i wentylacyjnych zgodnie z Rozp. MSWiA. Pełna dokumentacja powykonawcza.', icon: 'ShieldCheck' },
    { title: 'Czyszczenie przewodów', desc: 'Czyszczenie kominów dymowych, spalinowych i wentylacyjnych. Frezowanie, usuwanie sadzy i osadów.', icon: 'Wrench' },
    { title: 'Montaż wkładów kominowych', desc: 'Wkłady stalowe i kwasoodporne — zabezpieczenie komina przed kondensatem, zalecane przy kotłach kondensacyjnych.', icon: 'Flame' },
    { title: 'Montaż nasad kominowych', desc: 'Nasady przeciwzaciągowe, hybrydowe i turbowent — poprawa ciągu, ochrona przed warunkami atmosferycznymi.', icon: 'Wind' },
    { title: 'Kontrola instalacji gazowej', desc: 'Próby szczelności i kontrola domowych instalacji gazowych. Dokumenty wymagane przez gazownię.', icon: 'Flame' },
    { title: 'Inspekcja kamerą', desc: 'Dokładna diagnostyka przewodu kamerą HD — wykrywanie nieszczelności, pęknięć, zatkania.', icon: 'Camera' },
    { title: 'Opinie kominiarskie', desc: 'Opinie do projektu budowlanego, dla gazowni, nadzoru budowlanego, sprzedaży nieruchomości. Wystawiane przez Mistrzów Kominiarskich.', icon: 'FileCheck' },
  ],
  about: {
    eyebrow: 'O Firmie GS Instal Sp. z o.o.',
    title: 'Doświadczeni kominiarze z Garwolina',
    body: 'GS Instal Sp. z o.o. to firma rodzinna z Garwolina, prowadzona przez Grzegorza Sitka i Kamila Głodka — wspólników z wieloletnim doświadczeniem w branży kominiarskiej i instalacyjnej. Świadczymy kompleksowe usługi kominiarskie, gazowe i instalacyjne dla domów jednorodzinnych, wspólnot mieszkaniowych i spółdzielni z Garwolina, powiatu garwolińskiego oraz całego województwa mazowieckiego.',
    benefits: [
      'Certyfikowani Mistrzowie Kominiarscy',
      'Kompleksowe usługi: kominy, gaz, wentylacja',
      'Pełna dokumentacja do gazowni i nadzoru',
      'Garwolin, powiat garwoliński, woj. mazowieckie',
      'Szybki czas reakcji — działamy w terenie',
    ],
    badge_number: '10+',
    badge_text: 'Lat doświadczenia',
  },
  team: [
    {
      name: 'Grzegorz Sitek',
      role: 'Prezes Zarządu • Mistrz Kominiarski',
      description: 'Współzałożyciel GS Instal. Prowadzi również jednoosobową działalność GSC Grzegorz Sitek (Garwolin, ul. Korczaka 9/19) od 2013 roku — specjalizuje się w usługach kominiarskich, instalacjach wentylacji mechanicznej i montażu rekuperacji.',
      phone: '',
      email: '',
    },
    {
      name: 'Kamil Głodek',
      role: 'Wspólnik • Mistrz Kominiarski',
      description: 'Współzałożyciel GS Instal. Prowadzi również firmę "Kominiarz — Usługi Kominiarskie Kamil Głodek" (Garwolin, ul. Wiejska 57M/383). Laureat tytułu „Złota Firma 2023" z najwyższą oceną klientów 5/5.',
      phone: '',
      email: '',
    },
  ],
  cta_banner: {
    title: 'Bezpieczeństwo zaczyna się od kontroli',
    subtitle: 'Ustawowy obowiązek kontroli kominów i przewodów wentylacyjnych — zlecasz, my pamiętamy o terminach.',
    cta_label: 'Umów kontrolę',
  },
  contact_info: {
    company: 'GS Instal Sp. z o.o.',
    nip: '8262216780',
    regon: '523489810',
    krs: '0000999191',
    phone: '',
    phone_grzegorz: '',
    phone_kamil: '',
    email: '',
    address_line_1: 'ul. Aleja Legionów 17',
    address_line_2: '08-400 Garwolin',
    region: 'powiat garwoliński, woj. mazowieckie',
    bank_account: '47 1020 4476 0000 8402 0491 1337',
    bank_name: 'PKO BP',
    hours: [
      { day: 'Poniedziałek - Piątek', hours: '8:00 - 17:00' },
      { day: 'Sobota', hours: 'na zgłoszenie' },
      { day: 'Niedziela', hours: 'Zamknięte' },
    ],
  },
  seo: {
    page_title: 'GS Instal Sp. z o.o. — Usługi kominiarskie Garwolin | Kominy, gaz, wentylacja',
    meta_description: 'Profesjonalne usługi kominiarskie w Garwolinie i okolicach. Kontrole, czyszczenie, montaż wkładów i nasad, opinie kominiarskie. GS Instal Sp. z o.o. — Grzegorz Sitek i Kamil Głodek.',
    keywords: 'kominiarz Garwolin, kontrola kominiarska, czyszczenie komina, opinia kominiarska, wkład kominowy, GS Instal',
  },
};

let updated = 0;
for (const [key, value] of Object.entries(content)) {
  db.prepare(`
    INSERT INTO site_content (key, value, updated_by, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP
  `).run(key, JSON.stringify(value), adminId);
  updated++;
}

console.log(`✓ Zaktualizowano ${updated} sekcji CMS realnymi danymi GS Instal Sp. z o.o.`);
console.log('');
console.log('━━━ Co zostało wstawione z publicznych źródeł (KRS/CEIDG) ━━━');
console.log('  Firma:    GS Instal Sp. z o.o.');
console.log('  KRS:      0000999191');
console.log('  NIP:      8262216780');
console.log('  REGON:    523489810');
console.log('  Adres:    Aleja Legionów 17, 08-400 Garwolin');
console.log('  Zarząd:   Grzegorz Sitek (Prezes), Kamil Głodek (wspólnik)');
console.log('  Bank:     PKO BP 47 1020 4476 0000 8402 0491 1337');
console.log('');
console.log('━━━ Do uzupełnienia w panelu admina → CMS ━━━');
console.log('  ✗ Telefon kontaktowy biura');
console.log('  ✗ Numer Grzegorza Sitka');
console.log('  ✗ Numer Kamila Głodka');
console.log('  ✗ Email firmowy');
console.log('  (nie znalazłem ich w publicznych źródłach — wpisz w CMS)');
process.exit(0);
