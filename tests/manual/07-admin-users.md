# 07 — Admin: zarządzanie użytkownikami

Logowanie: `admin@gs-instal.pl` / `demo1234`.

---

## TC-ADM-001: Dashboard admina
**Priorytet:** krytyczny

**Oczekiwany:**
- 8 kart KPI: użytkownicy / budynki / oferty / NBA / leady / zgłoszenia / wizyty zakończone / wizyty umówione
- 6 dużych kafelków akcji (Użytkownicy, Magic linki, Leady, CMS, Audit, Tryb kominiarza)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-002: Lista użytkowników
**Kroki:** „Użytkownicy".
**Oczekiwany:** Tabela ze wszystkimi kontami (~6 demo + ewentualne dodane przez testy).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-003: Filtrowanie po roli
**Kroki:** Kliknij filtr „Kominiarz".
**Oczekiwany:** Lista pokazuje tylko kominiarzy; nagłówek pokazuje liczbę („Kominiarz (X)").
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-004: Utworzenie nowego kominiarza
**Priorytet:** wysoki

**Kroki:**
1. „+ Nowy użytkownik"
2. Imię „Test Kominiarz", email `test.kom@gs-instal.pl`, hasło `test1234`, telefon `601 111 222`, rola „Kominiarz"
3. Wybierz „Mistrz Kominiarski" + nr uprawnień „99999/2025"
4. „Utwórz konto"

**Oczekiwany:** Modal zamyka się, konto pojawia się na liście z poprawnymi danymi.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-005: Logowanie nowo-utworzonym kontem
**Kroki:** Wyloguj się, zaloguj jako `test.kom@gs-instal.pl` / `test1234`.
**Oczekiwany:** Sukces, przekierowanie na `/panel/kominiarz`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-006: Edycja użytkownika
**Kroki:** Wróć jako admin → „Edytuj" przy `test.kom`. Zmień telefon na `601 999 888`.
**Oczekiwany:** Po zapisaniu nowy telefon widoczny na liście.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-007: Reset hasła
**Priorytet:** wysoki

**Kroki:** „Reset hasła" przy `test.kom`.

**Oczekiwany:**
- Pojawia się alert z **nowym, losowo wygenerowanym hasłem** (8 znaków)
- Hasło można skopiować z alertu
- Starym hasłem (`test1234`) nie da się już zalogować

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-008: Próba usunięcia siebie
**Kroki:** Spróbuj usunąć konto admin (`admin@gs-instal.pl`).
**Oczekiwany:** Błąd „Nie możesz usunąć siebie".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-009: Usunięcie użytkownika
**Kroki:** Usuń `test.kom@gs-instal.pl` (utworzony w TC-ADM-004).
**Oczekiwany:** Po potwierdzeniu konto znika z listy.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-010: Magic linki — pełen interfejs admina
**Kroki:** „Magic linki" w menu admina.
**Oczekiwany:** Lista wszystkich linków + przycisk „+ Wygeneruj link".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-011: Leady — przegląd globalny
**Kroki:** „Leady".
**Oczekiwany:** 4 karty statystyk + tabela wszystkich leadów z dropdownami statusów.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ADM-012: Audit log
**Priorytet:** krytyczny

**Kroki:** „Audit log".

**Oczekiwany:**
- Każda akcja admina z poprzednich testów ma wpis (user.create, user.update, user.reset_password, user.delete, magic_link.create, cms.update)
- Każdy wpis ma: datę, aktora, akcję, cel (target), payload

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
