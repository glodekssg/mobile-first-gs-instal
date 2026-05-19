# 08 — Admin: CMS strony

Logowanie: `admin@gs-instal.pl` / `demo1234`. Wejdź w `/panel/admin/cms`.

---

## TC-CMS-001: Lista sekcji
**Oczekiwany:** Przyciski sekcji u góry: Hero • O Firmie • CTA banner • Dane firmy i kontakt • SEO • Usługi (lista kart) • Zespół.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-002: Edycja Hero
**Priorytet:** krytyczny

**Kroki:**
1. Wybierz sekcję „Hero"
2. Zmień tytuł na „TEST CMS — kominiarz"
3. „Zapisz zmiany"
4. Otwórz `/` w nowej karcie

**Oczekiwany:**
- Komunikat „✓ Zapisano. Strona publiczna jest już zaktualizowana."
- Strona główna pokazuje nowy tytuł
- Cofnij zmianę (wpisz z powrotem oryginał)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-003: Edycja O Firmie — lista zalet
**Kroki:** Sekcja „O Firmie" → w polu „Lista zalet" dodaj nową linię „TEST zaleta".
**Oczekiwany:** Po zapisie na stronie głównej (sekcja About) pojawia się ten punkt na liście z checkmarkiem.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-004: Edycja CTA banner
**Kroki:** Sekcja „CTA banner" → zmień tytuł.
**Oczekiwany:** Po zapisie i otwarciu `/` parallax banner ma nowy tytuł.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-005: Dane firmy — wprowadzenie telefonów
**Priorytet:** krytyczny

**Kroki:**
1. Sekcja „Dane firmy i kontakt"
2. Wprowadź: telefon główny `+48 600 100 100`, telefon Grzegorza `+48 600 200 200`, telefon Kamila `+48 600 300 300`, email `biuro@gsinstal.pl`
3. Zapisz

**Oczekiwany:**
- Header strony publicznej pokazuje główny telefon z ikoną (zamiast „Umów wizytę")
- Stopka pokazuje wszystkie 3 telefony i email
- Zostają zachowane NIP/REGON/KRS/konto

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-006: Dane firmy — edycja godzin otwarcia
**Kroki:** W sekcji „Dane firmy" przewiń do „Godziny otwarcia", dodaj nowy wiersz „Test" / „24/7".
**Oczekiwany:** Po zapisie footer pokazuje nowy wiersz.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-007: Usługi — edycja istniejącej karty
**Priorytet:** wysoki

**Kroki:** Sekcja „Usługi (lista kart)" → zmień tytuł pierwszej usługi → zapisz → otwórz `/`.
**Oczekiwany:** Pierwsza karta usług ma nowy tytuł.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-008: Usługi — zmiana ikony
**Kroki:** Z dropdownu ikon dla pierwszej usługi wybierz „Zap".
**Oczekiwany:** Po zapisie i otwarciu `/` karta pokazuje ikonę pioruna.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-009: Usługi — dodanie nowej karty
**Kroki:** „+ dodaj usługę" → wypełnij → zapisz.
**Oczekiwany:** Nowa karta widoczna na stronie publicznej.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-010: Usługi — usunięcie
**Kroki:** „Usuń" przy testowej karcie → zapisz.
**Oczekiwany:** Karta znika z listy edytora i z `/`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-011: Zespół — wpisanie telefonów Grzegorza i Kamila
**Priorytet:** krytyczny

**Kroki:**
1. Sekcja „Zespół"
2. Przy Grzegorzu wpisz telefon `+48 600 200 200`, email `grzegorz@gsinstal.pl`
3. Przy Kamilu telefon `+48 600 300 300`, email `kamil@gsinstal.pl`
4. Zapisz

**Oczekiwany:** Sekcja „Zespół" na stronie publicznej pokazuje przy każdej osobie ikony tel/mail z klikalnymi numerami/adresami.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-012: Zespół — usunięcie osoby
**Kroki:** „Usuń" przy testowej osobie → zapisz.
**Oczekiwany:** Osoba znika z listy.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-013: SEO — edycja meta
**Kroki:** Sekcja „SEO" → wypełnij wszystkie pola → zapisz.
**Oczekiwany:** Po zapisie tag `<title>` w `<head>` na `/` zawiera nową treść (sprawdź F12 → Elements).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-CMS-014: Cofnij zmiany przed zapisem
**Kroki:** Wprowadź zmiany w dowolnej sekcji ale **bez zapisu** → kliknij „Cofnij".
**Oczekiwany:** Pola wracają do poprzedniej zawartości.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
