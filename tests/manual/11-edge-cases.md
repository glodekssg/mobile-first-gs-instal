# 11 — Przypadki brzegowe i bezpieczeństwo

---

## TC-EDGE-001: Próba SQL injection w loginie
**Kroki:** Wpisz w email: `' OR '1'='1` z dowolnym hasłem.
**Oczekiwany:** Komunikat „Błędny email lub hasło" (parameteryzowane zapytania).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-002: XSS w formularzu kontaktowym
**Kroki:** W polu „Wiadomość" public form wpisz `<script>alert('XSS')</script>`. Wyślij.
**Oczekiwany:** Po dostarczeniu (admin/Leady) tekst widoczny jako **zwykły tekst** (nie wykonuje się), bez popupu.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-003: XSS w polach CMS
**Kroki:** W CMS Hero title wpisz `<img src=x onerror=alert(1)>`.
**Oczekiwany:** Strona główna pokazuje to jako tekst, nie wykonuje JS.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-004: Polskie znaki w danych
**Kroki:** Utwórz mieszkańca z imieniem „Łucja Średzińska-Żółć".
**Oczekiwany:** Imię wyświetla się bez zniekształceń (utf-8) we wszystkich miejscach.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-005: Bardzo długi tekst w CMS
**Kroki:** Wklej 2000 znaków w hero.subtitle.
**Oczekiwany:** Zapisuje się, wyświetla bez crashu (może wybić layout — to OK, ale nie powinno być błędu).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-006: Mieszkaniec nie widzi cudzych wizyt
**Kroki:** Marek loguje się i sprawdza historię.
**Oczekiwany:** Widzi tylko swoje wizyty (m. 3), nie widzi Kasi (m. 5) ani Piotra.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-007: Próba dostępu do cudzego mieszkania przez API
**Kroki:** Zaloguj się jako Marek. W DevTools wykonaj `fetch('/api/visits/book', {method:'POST', headers:{Authorization:'Bearer '+localStorage.gs_token, 'Content-Type':'application/json'}, body: JSON.stringify({apartment_id: 3, scheduled_at: '2026-06-01T10:00:00.000Z', type: 'kontrola', kominiarz_id: 2})})`.
**Oczekiwany:** Odpowiedź 403 „To nie Twoje mieszkanie".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-008: Próba wejścia mieszkańca w panel admina
**Kroki:** Zaloguj się jako Marek, wpisz w URL `/panel/admin/users`.
**Oczekiwany:** Strona pokazuje się (frontend nie ogranicza), ale API zwraca 403 — lista pusta / error.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-009: Wygasły token JWT
**Kroki:** W DevTools podmień localStorage `gs_token` na fragment + losowy znak. Odśwież panel.
**Oczekiwany:** Przekierowanie na `/login`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-010: Próba podwójnej rezerwacji tego samego slotu
**Kroki:**
1. Mieszkaniec A rezerwuje slot 2026-06-01 10:00
2. W innej karcie mieszkaniec B próbuje zarezerwować ten sam slot (musi mieć inne mieszkanie)

**Oczekiwany:** Drugi nie widzi już tego slotu w `/visits/slots/...`. Gdyby spróbował przez API, system powinien odrzucić.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-011: Rejestracja z bardzo krótkim hasłem
**Kroki:** Rejestracja z hasłem `12`.
**Oczekiwany:** Frontend lub backend powinien odrzucić (min. 6 znaków).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-012: Rejestracja ze złym formatem email
**Kroki:** Wpisz `nie-email`.
**Oczekiwany:** Walidacja HTML5 nie pozwala wysłać.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-013: Magic link — wygasły token
**Kroki:** W bazie zmień `expires_at` linku na wczoraj. Otwórz w incognito.
**Oczekiwany:** „Link wygasł".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-014: Mobile — strona publiczna
**Kroki:** Otwórz `/` w DevTools w trybie mobile (iPhone 14).
**Oczekiwany:** Header pokazuje hamburger menu; wszystkie sekcje skalują się; brak poziomego scrolla.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-015: Mobile — panel kominiarza
**Kroki:** Tryb mobile na panelu.
**Oczekiwany:** Działa, choć sidebar może być za szeroki. Min. tabela z wizytami jest scrollowalna w poziomie.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-016: Refresh w trakcie wypełniania formularza
**Kroki:** Wypełnij formularz public → F5.
**Oczekiwany:** Dane się tracą (brak ostrzeżenia, OK).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-017: Wiele zakładek z różnymi rolami
**Kroki:** Karta 1: admin. Karta 2: ten sam browser, ten sam localStorage → /panel/kominiarz.
**Oczekiwany:** Obie działają (token w localStorage jest ten sam, role kontroluje API).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-EDGE-018: Restart serwera w trakcie używania
**Kroki:** Zaloguj się, zatrzymaj serwer (Ctrl+C), wykonaj jakąkolwiek akcję.
**Oczekiwany:** Frontend pokazuje error fetch; po restarcie i odświeżeniu wszystko wraca do działania (token w localStorage przetrwa).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
