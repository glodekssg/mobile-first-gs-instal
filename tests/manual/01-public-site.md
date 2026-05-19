# 01 — Strona publiczna

Wszystkie testy zaczynaj **na http://localhost:5174 (bez logowania)**.

---

## TC-PUB-001: Strona ładuje się bez błędów
**Priorytet:** krytyczny

**Kroki:**
1. Otwórz http://localhost:5174
2. Otwórz DevTools (F12) → zakładka Console

**Oczekiwany:**
- Strona renderuje się w pełni (Header + Hero + Usługi + O firmie + Zespół + CTA + Formularz + Footer)
- Brak czerwonych errorów w Console
- Brak ostrzeżeń typu „Failed to load resource"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-002: Header — logo
**Kroki:** Kliknij „GS INSTAL." w lewym górnym rogu.
**Oczekiwany:** Przekierowanie / scroll na stronę główną.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-003: Header — link „O Nas"
**Kroki:** Kliknij „O Nas" w nawigacji.
**Oczekiwany:** Smooth-scroll do sekcji „O Firmie GS Instal Sp. z o.o.".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-004: Header — link „Usługi"
**Kroki:** Kliknij „Usługi".
**Oczekiwany:** Scroll do siatki 7 kart usług.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-005: Header — link „Zespół"
**Kroki:** Kliknij „Zespół".
**Oczekiwany:** Scroll do sekcji z 2 kartami: Grzegorz Sitek i Kamil Głodek.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-006: Header — link „Kontakt"
**Kroki:** Kliknij „Kontakt".
**Oczekiwany:** Scroll do formularza „Umów wizytę".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-007: Header — przycisk „Panel"
**Kroki:** Kliknij „Panel" (z ikoną klucza/login).
**Oczekiwany:** Przejście na `/login`, widoczny formularz logowania.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-008: Header — przycisk telefon/„Umów wizytę"
**Kroki:** Sprawdź pomarańczowy przycisk w prawym górnym rogu.

**Oczekiwany:**
- Jeśli w CMS `contact_info.phone` jest pusty → tekst „Umów wizytę" + ikona kalendarza → kliknięcie scrolluje do formularza
- Jeśli wpisany numer → tekst z numerem + ikona telefonu → kliknięcie otwiera tel:

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-009: Hero — wyświetlanie treści z CMS
**Kroki:** Sprawdź tekst Hero.
**Oczekiwany:**
- Tytuł: „Kominiarz w Garwolinie i okolicach"
- Podtytuł zawiera „GS Instal Sp. z o.o."
- Przycisk z napisem (np. „Umów wizytę")

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-010: Hero — przycisk CTA
**Kroki:** Kliknij główny przycisk w Hero (np. „Umów wizytę").
**Oczekiwany:** Scroll do formularza kontaktowego.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-011: Usługi — wyświetla 7 kart
**Kroki:** Przejrzyj sekcję „Nasze Usługi".

**Oczekiwany:** 7 kart z ikonami:
1. Okresowe kontrole przewodów
2. Czyszczenie przewodów
3. Montaż wkładów
4. Montaż nasad
5. Kontrola instalacji gazowej
6. Inspekcja kamerą
7. Opinie kominiarskie

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-012: O firmie — dane firmy
**Kroki:** Przejrzyj sekcję „O firmie".
**Oczekiwany:**
- Wzmianka o Grzegorzu Sitku i Kamilu Głodku
- Lista 5 zalet z checkmarkami
- Odznaka pomarańczowa (10+ lat doświadczenia)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-013: Zespół — 2 osoby
**Kroki:** Przejrzyj sekcję „Nasz Zespół".
**Oczekiwany:**
- 2 karty: „Grzegorz Sitek" i „Kamil Głodek"
- Każda z opisem
- Stopka karty: telefon/email LUB „Skontaktuj się przez formularz →"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-014: CTA banner
**Kroki:** Przewiń do parallax banneru.
**Oczekiwany:** Tytuł „Bezpieczeństwo zaczyna się od kontroli" + przycisk linkujący do formularza.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-015: Formularz „Umów wizytę" — happy path
**Priorytet:** krytyczny

**Kroki:**
1. Wypełnij: Imię = „Test Tester", Telefon = „600 999 999"
2. Wybierz usługę z dropdownu
3. Kliknij „Wyślij zapytanie"

**Oczekiwany:**
- Po wysłaniu pojawia się ekran sukcesu z zielonym checkiem
- Komunikat „Dziękujemy! Otrzymaliśmy zgłoszenie."
- Klik „Wyślij kolejne zapytanie" resetuje formularz

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-016: Formularz — walidacja wymaganych pól
**Kroki:**
1. Spróbuj wysłać pusty formularz
2. Spróbuj wysłać tylko z imieniem (bez telefonu)

**Oczekiwany:** Przeglądarka blokuje wysyłkę, wskazuje brakujące pole.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-017: Footer — dane rejestrowe firmy
**Kroki:** Przewiń na sam dół.
**Oczekiwany:** Linia z NIP `8262216780`, REGON `523489810`, KRS `0000999191`, numer konta PKO BP.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-PUB-018: Footer — linki
**Kroki:** Kliknij kolejno: „O firmie", „Usługi kominiarskie", „Nasz zespół", „Umów wizytę".
**Oczekiwany:** Każdy linkuje do odpowiedniej sekcji (#o-nas, #uslugi, #zespol, #kontakt-form).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
