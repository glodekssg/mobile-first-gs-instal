# 00 — Przygotowanie środowiska testowego

Te kroki **musisz** wykonać raz przed rozpoczęciem testów.

---

## TC-SETUP-001: Instalacja zależności
**Priorytet:** krytyczny

**Kroki:**
1. Otwórz terminal w katalogu projektu
2. Wykonaj: `npm install`

**Oczekiwany rezultat:**
- Komenda kończy się sukcesem
- Powstaje folder `node_modules/`

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-SETUP-002: Inicjalizacja bazy danych demo
**Priorytet:** krytyczny

**Kroki:**
1. `npm run seed`

**Oczekiwany rezultat:**
- Komunikat „seedowanie bazy demo..."
- Komunikat „NBA wygenerowało X akcji" (X ≥ 5)
- Wyświetlone konta demo (admin, kominiarz, zarządca, 3 mieszkańców)
- Wyświetlone kody zaproszeń (CODE1...HOMECODE)
- Wyświetlony „Demo magic link: /p/demo-marek-..."

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-SETUP-003: Uruchomienie aplikacji (backend + frontend)
**Priorytet:** krytyczny

**Kroki:**
1. `npm run dev`
2. Poczekaj aż w konsoli pojawi się: `[api] http://localhost:4000` oraz `Local: http://localhost:5174/`
3. Otwórz przeglądarkę: http://localhost:5174

**Oczekiwany rezultat:**
- Backend nasłuchuje na `:4000`
- Frontend nasłuchuje na `:5174` (lub `:5173` jeśli wolny)
- Strona publiczna ładuje się z headerem i sekcjami: Hero / Usługi / O firmie / Zespół / CTA / Formularz / Footer

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-SETUP-004: Smoke test API
**Priorytet:** krytyczny

**Kroki:**
1. W przeglądarce otwórz: http://localhost:4000/api/health

**Oczekiwany rezultat:**
- Odpowiedź JSON: `{"ok":true,"time":"..."}`

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
