# 02 — Autoryzacja

---

## TC-AUTH-001: Otwarcie strony logowania
**Kroki:** Wejdź na http://localhost:5174/login (lub kliknij „Panel" w headerze).

**Oczekiwany:**
- Formularz email + hasło
- Przyciski „Google" + „Facebook"
- Link „Zarejestruj się"
- Lista demo kont (admin, kominiarz, zarządca, mieszkaniec)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-002: Logowanie kominiarza
**Priorytet:** krytyczny

**Kroki:** Zaloguj się jako `mistrz@gs-instal.pl` / `demo1234`.

**Oczekiwany:** Przekierowanie na `/panel/kominiarz`, widoczny Dashboard z imieniem „Jan Kowalski" w lewym sidebarze.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-003: Logowanie admina
**Priorytet:** krytyczny

**Kroki:** Zaloguj się jako `admin@gs-instal.pl` / `demo1234`.

**Oczekiwany:** Przekierowanie na `/panel/admin`, widoczny Dashboard admina ze statystykami.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-004: Logowanie zarządcy
**Kroki:** `zarzadca@spoldzielnia.pl` / `demo1234`.
**Oczekiwany:** Przekierowanie na `/panel/spoldzielnia`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-005: Logowanie mieszkańca
**Kroki:** `marek@example.com` / `demo1234`.
**Oczekiwany:** Przekierowanie na `/panel/mieszkaniec`, widoczna karta mieszkania na Słonecznej 1/3.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-006: Logowanie — błędne hasło
**Kroki:** Wpisz `marek@example.com` z hasłem `zlehaslo`.
**Oczekiwany:** Komunikat błędu „Błędny email lub hasło", nie przekierowuje.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-007: Logowanie — nieistniejący email
**Kroki:** `nieistnieje@nigdzie.xyz` / `demo1234`.
**Oczekiwany:** Komunikat błędu (taki sam jak wyżej — anti-enumeration).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-008: Rejestracja nowego mieszkańca
**Kroki:**
1. Kliknij „Zarejestruj się"
2. Wypełnij: imię „Nowy Mieszkaniec", email `nowy.test@example.com`, hasło `test1234`, telefon `600 111 222`, rola „mieszkaniec"
3. Kliknij „Załóż konto"

**Oczekiwany:** Automatyczne zalogowanie + przekierowanie na `/panel/mieszkaniec`.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-009: Rejestracja — email zajęty
**Kroki:** Spróbuj zarejestrować się na `marek@example.com`.
**Oczekiwany:** Błąd „Email zajęty".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-010: OAuth — Google (mock)
**Kroki:**
1. Kliknij „Zaloguj przez Google"
2. W promptach wpisz: rola = `mieszkaniec`, email = `test.google@example.com`

**Oczekiwany:**
- Konto tworzone automatycznie
- Zalogowanie + przekierowanie na panel mieszkańca

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-011: OAuth — Facebook (mock)
**Kroki:** Analogicznie jak wyżej, ale Facebook.
**Oczekiwany:** Tak samo — konto tworzone, zalogowanie.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-012: Wylogowanie
**Kroki:**
1. Zaloguj się na dowolne konto
2. W lewym sidebarze kliknij „Wyloguj"

**Oczekiwany:** Przekierowanie na `/login`, próba wejścia na `/panel/...` cofa do logowania.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-013: Dostęp do panelu bez logowania
**Kroki:** Wyloguj się i wpisz w pasku adresu `http://localhost:5174/panel/admin`.
**Oczekiwany:** Przekierowanie na `/login`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTH-014: Sesja persystentna po refreshu
**Kroki:**
1. Zaloguj się jako kominiarz
2. Wciśnij F5

**Oczekiwany:** Po odświeżeniu nadal zalogowany (token w localStorage), bez konieczności ponownego logowania.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
