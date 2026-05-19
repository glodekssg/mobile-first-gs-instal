# 04 — Panel mieszkańca

Logowanie: `marek@example.com` / `demo1234`.

---

## TC-RES-001: Łączenie konta z mieszkaniem przez kod zaproszenia
**Priorytet:** wysoki

**Warunki wstępne:** Wyloguj się i zarejestruj **nowe** konto (TC-AUTH-008).

**Kroki:**
1. Po rejestracji widzisz panel mieszkańca **bez** przypisanego mieszkania
2. Powinien być żółty box „Połącz swoje mieszkanie"
3. Wpisz kod `CODE4` i kliknij „Połącz"

**Oczekiwany:** Mieszkanie „ul. Kwiatowa 4, m. 2" pojawia się w panelu.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-002: Próba użycia złego kodu
**Kroki:** Wpisz kod `ZLY999` i kliknij „Połącz".
**Oczekiwany:** Komunikat „Nieprawidłowy kod".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-003: Próba użycia kodu zajętego przez kogoś innego
**Kroki:** Wpisz `CODE1` (już zajęty przez Marka).
**Oczekiwany:** Komunikat „Mieszkanie już przypisane".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-004: Dashboard mieszkańca
**Kroki:** Zaloguj się jako Marek.
**Oczekiwany:**
- Karta „Twoje mieszkanie" z adresem
- Karta „Najbliższa wizyta" (lub przycisk „Umów wizytę")
- Karta „Oferty czekają" z liczbą
- Sekcja „Co możesz zrobić" (z NBA jeśli są)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-005: Umów wizytę — lista mieszkań (gdy masz tylko jedno)
**Kroki:** „Umów wizytę" w menu.
**Oczekiwany:** Pomijany wybór mieszkania — od razu wybór usługi + sloty.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-006: Wybór rodzaju wizyty
**Kroki:** Wybierz „Inspekcja kamerą" klikając kafelek.
**Oczekiwany:** Kafelek podświetlony pomarańczowo, pozostałe pozostają białe.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-007: Wyświetlanie dostępnych slotów
**Priorytet:** krytyczny

**Kroki:** Po wybraniu typu, przewiń do „Dostępne terminy".

**Oczekiwany:**
- Sloty pogrupowane po dniach (data + nazwa dnia tygodnia, polskie nazwy)
- Soboty/niedziele pominięte
- Godziny pracy: 08:00 – 16:00
- Brak slotów które są już zarezerwowane

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-008: Rezerwacja wizyty
**Priorytet:** krytyczny

**Kroki:** Kliknij dowolny slot.

**Oczekiwany:**
- Komunikat „✓ Wizyta umówiona. Otrzymasz potwierdzenie e-mailem."
- Przekierowanie na dashboard po 1.5s
- Karta „Najbliższa wizyta" pokazuje nowo zarezerwowaną wizytę

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-009: Historia kontroli
**Kroki:** Przejdź do „Historia kontroli".
**Oczekiwany:** Lista wizyt (umówione + zakończone + odwołane) z statusami; jeśli są zakończone — sekcja „Protokoły do pobrania".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-010: Pobranie protokołu PDF
**Kroki:** Kliknij „Pobierz PDF" przy zakończonej wizycie.
**Oczekiwany:** Otwiera się nowa zakładka z wygenerowanym dokumentem (tytuł „PROTOKÓŁ KONTROLI KOMINIARSKIEJ", dane wizyty).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-011: Lista ofert dla mieszkańca
**Kroki:** „Oferty dla mnie".
**Oczekiwany:** Lista ofert z ceną, opisem, datą wygaśnięcia. Aktywne mają przyciski „Akceptuję"/„Odrzucam".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-012: Akceptacja oferty
**Priorytet:** wysoki

**Kroki:** „Akceptuję" przy aktywnej ofercie.

**Oczekiwany:**
- Potwierdzenie w prompcie
- Status zmieniony na „zaakceptowana"
- Po sprawdzeniu wizyt w historii — nowa wizyta realizacyjna za ~7 dni

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-013: Zgłoszenie usterki
**Kroki:** „Zgłoś usterkę" → wypełnij i wyślij.
**Oczekiwany:** „✓ Zgłoszenie przyjęte. Skontaktujemy się wkrótce." + zgłoszenie pojawia się w sekcji „Twoje zgłoszenia".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-014: Próba zgłoszenia bez wyboru mieszkania
**Kroki:** Wyślij formularz bez wybrania mieszkania z dropdown.
**Oczekiwany:** Walidacja — przeglądarka blokuje wysyłkę.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-RES-015: Wybór mieszkania (gdy mieszkaniec ma kilka)
**Warunki wstępne:** Mieszkaniec musi mieć dwa mieszkania (połącz drugie kodem).

**Kroki:** „Umów wizytę" → sprawdź dropdown.
**Oczekiwany:** Pojawia się sekcja „Mieszkanie" z dropdown'em z oboma adresami.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
