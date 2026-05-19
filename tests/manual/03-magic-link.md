# 03 — Magic link (prospect bez logowania)

Magic link to URL `/p/<token>` dający mieszkańcowi dostęp do panelu **bez konieczności rejestracji**.

---

## TC-MAGIC-001: Otwarcie demo magic linka
**Priorytet:** krytyczny

**Warunki wstępne:** Po `npm run seed` w konsoli wypisano `Demo magic link: /p/demo-marek-...`. Skopiuj ten URL.

**Kroki:** Otwórz w przeglądarce w **trybie incognito** (bez sesji).

**Oczekiwany:**
- Strona ładuje się bez logowania
- Header: „GS INSTAL." + „Bezpieczny link osobisty"
- Powitanie „Witaj, Marek Wiśniewski"
- Adres: „ul. Słoneczna 1, m. 3 • Warszawa • SM «Słoneczna»"
- Lista wizyt (co najmniej 1 umówiona)
- Pole „Zgłoś usterkę"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-002: Nieprawidłowy token
**Kroki:** Otwórz `http://localhost:5174/p/zly-token-123`.
**Oczekiwany:** Ekran „Link nieprawidłowy" z linkiem powrotnym na stronę główną.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-003: Wyświetlenie ofert czekających
**Kroki:** Otwórz demo magic link.
**Oczekiwany:** Pomarańczowy panel „Mamy dla Pana/Pani propozycję" z 1 ofertą (Inspekcja kamerą, 250 zł) + przyciski Akceptuję/Odrzucam.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-004: Przełożenie wizyty — otwarcie picker
**Priorytet:** wysoki

**Kroki:** Kliknij przycisk „Przełóż" przy wizycie umówionej.

**Oczekiwany:**
- Pojawia się panel z dostępnymi slotami pogrupowanymi po dniach
- Każdy dzień = osobny nagłówek (np. „piątek, 22 maja")
- Sloty w formacie `HH:MM`

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-005: Przełożenie wizyty — wybór terminu
**Priorytet:** krytyczny

**Kroki:** Kliknij dowolny slot.

**Oczekiwany:**
- Zielony komunikat „✓ Wizyta przełożona."
- Lista wizyt odświeża się z nową datą
- W konsoli serwera log o powiadomieniu kominiarza (in_app)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-006: Magic link respektuje zakres dat (NOWA FUNKCJA)
**Priorytet:** wysoki

**Warunki wstępne:** Admin/kominiarz tworzy magic link **z ograniczonym zakresem dat** (np. od jutra do za 3 dni).

**Kroki:**
1. Otwórz ten magic link
2. Kliknij „Przełóż" na wizycie

**Oczekiwany:** Pokazują się **tylko sloty w zadanym zakresie** (jutro–za 3 dni), nie ma slotów spoza zakresu.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-007: Magic link respektuje dozwolone usługi (NOWA FUNKCJA)
**Priorytet:** wysoki

**Warunki wstępne:** Magic link utworzony z dozwolonymi usługami = tylko „kontrola" i „czyszczenie".

**Kroki:** Otwórz link, w formularzu rezerwacji nowej wizyty rozwiń dropdown typów.

**Oczekiwany:** Dropdown zawiera tylko „Kontrola okresowa" i „Czyszczenie" (nie ma inspekcji kamerą, opinii itp.).

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-008: Odwołanie wizyty
**Kroki:**
1. Kliknij „Odwołaj" przy wizycie
2. W prompcie wpisz powód: „Wyjeżdżam"

**Oczekiwany:**
- Komunikat „✓ Wizyta odwołana."
- Status wizyty zmieniony na „Odwołana"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-009: Zgłoszenie usterki przez prospect
**Kroki:**
1. Kliknij „+ Zgłoś usterkę"
2. Wpisz tytuł „Dymi z kominka", opis „Po rozpaleniu", priorytet „high"
3. Wyślij

**Oczekiwany:**
- Komunikat „✓ Zgłoszenie wysłane."
- Kominiarz po zalogowaniu widzi to zgłoszenie

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-010: Akceptacja oferty
**Kroki:** W panelu „Mamy dla Pana/Pani propozycję" kliknij „Akceptuję" przy ofercie.

**Oczekiwany:**
- Potwierdzenie w prompcie
- Komunikat „✓ Oferta zaakceptowana. Wizyta realizacyjna umówiona."
- Oferta znika z listy

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-011: Odrzucenie oferty
**Kroki:** Kliknij „Odrzucam" przy innej ofercie.
**Oczekiwany:** Status oferty „odrzucona", znika z listy.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-012: Magic link — wygaśnięcie po dacie
**Kroki:** Otwórz token, który ma `expires_at` w przeszłości (admin może utworzyć z `days = -1` albo zmienić ręcznie w bazie).
**Oczekiwany:** Komunikat „Link wygasł".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-013: Magic link — unieważnienie
**Kroki:**
1. Zaloguj się jako admin
2. Wejdź `/panel/admin/magic-links`
3. Kliknij „Unieważnij" przy demo linku
4. W incognito otwórz znów ten URL

**Oczekiwany:** Komunikat „Link został unieważniony".

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-014: Magic link — anonimowy (bez profilu)
**Priorytet:** wysoki

**Kroki:**
1. Admin tworzy link **bez wybranego mieszkańca** — tylko imię + telefon (np. „Jan Cold-prospect" + 600 333 444)
2. Otwórz link w incognito

**Oczekiwany:**
- Witanie „Witaj, Jan Cold-prospect"
- Brak sekcji mieszkania (komunikat „Skontaktuj się z kominiarzem aby przypisać mieszkanie")
- Działa zgłoszenie usterki

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-015: Konwersja prospect → konto
**Kroki:** Na stronie prospecta kliknij na dole „Załóż darmowe konto".
**Oczekiwany:** Przekierowanie na `/register`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-MAGIC-016: Powiadomienie kominiarza po akcji prospecta
**Kroki:**
1. Przełóż wizytę przez magic link
2. Zaloguj się jako kominiarz
3. Wejdź `/panel/kominiarz/ustawienia` (sekcja Powiadomienia)

**Oczekiwany:** W liście powiadomień jest wpis „Wizyta przełożona — Mieszkaniec ... przełożył wizytę na ...".

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
