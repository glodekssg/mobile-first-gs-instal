// Wspólne definicje "+ Dodaj nowy" dla różnych encji
import { api } from './api';

export async function createBuilding(data) {
  const r = await api('/buildings', { method: 'POST', body: { ...data, apartments_count: Number(data.apartments_count || 1) } });
  return { id: r.id, ...data };
}

export const buildingFields = [
  { k: 'address', label: 'Adres', required: true, placeholder: 'ul. Słoneczna 5' },
  { k: 'city', label: 'Miasto', placeholder: 'Garwolin' },
  { k: 'postal_code', label: 'Kod pocztowy', placeholder: '08-400' },
  { k: 'type', label: 'Typ', type: 'select', options: [
    { value: 'wielorodzinny', label: 'Wielorodzinny' },
    { value: 'jednorodzinny', label: 'Jednorodzinny' },
    { value: 'uslugowy', label: 'Usługowy' },
  ]},
  { k: 'apartments_count', label: 'Liczba mieszkań', type: 'number', default: 1 },
];

export async function createCooperative(data) {
  const r = await api('/cooperatives', { method: 'POST', body: data });
  return { id: r.id, ...data };
}

export const cooperativeFields = [
  { k: 'name', label: 'Nazwa', required: true, placeholder: 'SM «Słoneczna»' },
  { k: 'nip', label: 'NIP', placeholder: '5251234567' },
  { k: 'address', label: 'Adres', placeholder: 'ul. ...' },
];

export async function createApartment(data) {
  const body = { ...data, building_id: Number(data.building_id) };
  const r = await api('/apartments', { method: 'POST', body });
  return { id: r.id, invite_code: r.invite_code, ...data };
}

export const apartmentFieldsForBuilding = (buildingId) => [
  { k: 'building_id', type: 'hidden', default: buildingId },
  { k: 'number', label: 'Numer mieszkania', required: true, placeholder: '3' },
  { k: 'floor', label: 'Piętro', placeholder: '1' },
];

export async function createResident(data) {
  // Tworzy konto mieszkańca i jeśli podany apartment_id przypisuje go
  const body = {
    email: data.email,
    full_name: data.full_name,
    phone: data.phone || null,
    password: data.password || Math.random().toString(36).slice(2, 10),
    role: 'mieszkaniec',
  };
  const r = await api('/admin/users', { method: 'POST', body });
  return { id: r.id, ...data };
}

export const residentFields = [
  { k: 'full_name', label: 'Imię i nazwisko', required: true, placeholder: 'Jan Kowalski' },
  { k: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jan@example.com' },
  { k: 'phone', label: 'Telefon', placeholder: '+48 600 ___' },
  { k: 'password', label: 'Hasło (puste = auto-generowane)', type: 'password' },
];

export async function createKominiarz(data) {
  const body = {
    email: data.email,
    full_name: data.full_name,
    phone: data.phone || null,
    password: data.password || Math.random().toString(36).slice(2, 10),
    role: 'kominiarz',
    uprawnienia: data.uprawnienia || null,
    nr_uprawnien: data.nr_uprawnien || null,
  };
  const r = await api('/admin/users', { method: 'POST', body });
  return { id: r.id, ...data };
}

export const kominiarzFields = [
  { k: 'full_name', label: 'Imię i nazwisko', required: true },
  { k: 'email', label: 'Email', type: 'email', required: true },
  { k: 'phone', label: 'Telefon' },
  { k: 'uprawnienia', label: 'Uprawnienia', type: 'select', options: [
    { value: 'mistrz', label: 'Mistrz Kominiarski' },
    { value: 'czeladnik', label: 'Czeladnik' },
  ]},
  { k: 'nr_uprawnien', label: 'Nr uprawnień', placeholder: '12345/2018' },
  { k: 'password', label: 'Hasło (puste = auto)', type: 'password' },
];

export async function createChimney(data) {
  const body = { ...data, building_id: Number(data.building_id) };
  if (body.apartment_id) body.apartment_id = Number(body.apartment_id);
  const r = await api('/chimneys', { method: 'POST', body });
  return { id: r.id, ...data };
}
