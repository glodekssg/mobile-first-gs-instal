export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pl-PL');
}
export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}
export function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}
export const roleLabel = {
  kominiarz: 'Kominiarz',
  zarzadca: 'Zarządca',
  mieszkaniec: 'Mieszkaniec',
  admin: 'Administrator',
};
export const visitTypeLabel = {
  kontrola: 'Kontrola okresowa',
  czyszczenie: 'Czyszczenie',
  inspekcja_kamera: 'Inspekcja kamerą',
  montaz_wkladu: 'Montaż wkładu',
  montaz_nasady: 'Montaż nasady',
  kontrola_gaz: 'Kontrola instalacji gazowej',
  opinia: 'Opinia kominiarska',
};
export const statusLabel = {
  nowa: 'Nowa',
  umowiona: 'Umówiona',
  w_trakcie: 'W trakcie',
  zakonczona: 'Zakończona',
  odwolana: 'Odwołana',
  odmowa_wpuszczenia: 'Odmowa wpuszczenia',
};
export const statusColor = {
  nowa: 'bg-slate-200 text-slate-700',
  umowiona: 'bg-blue-100 text-blue-700',
  w_trakcie: 'bg-amber-100 text-amber-700',
  zakonczona: 'bg-emerald-100 text-emerald-700',
  odwolana: 'bg-rose-100 text-rose-700',
  odmowa_wpuszczenia: 'bg-rose-200 text-rose-800',
};
