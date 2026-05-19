# 05 — Panel kominiarza

Logowanie: `mistrz@gs-instal.pl` / `demo1234`.

---

## TC-KOM-001: Dashboard — KPI cards
**Priorytet:** krytyczny

**Oczekiwany:** 4 karty:
- „Dziś" — liczba wizyt dzisiejszych
- „Najbliższe 7 dni"
- „Zaległe kontrole" (czerwone)
- „Aktywne oferty" (żółte)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-002: Dashboard — najbliższe wizyty
**Kroki:** Sprawdź sekcję „Najbliższe wizyty".
**Oczekiwany:** Lista do 5 wizyt; każda klikalna, prowadzi do detalu wizyty.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-003: Dashboard — Next Best Action preview
**Kroki:** Prawa karta „Next Best Action".
**Oczekiwany:** Top 5 rekomendacji z kropką priorytetu (czerwona/żółta/szara). Link „Wszystkie →".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-004: Kalendarz — widok tygodniowy
**Kroki:** „Kalendarz".
**Oczekiwany:** 7 kolumn (pon–nd), aktualna data podświetlona; wizyty w slotach godzinowych z kolorami statusów.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-005: Kalendarz — nawigacja
**Kroki:** Klik „Następny ›", „Poprzedni ‹", „Dziś".
**Oczekiwany:** Tytuł zmienia datę zakresu tygodnia; „Dziś" wraca do bieżącego tygodnia.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-006: Kalendarz — wejście w wizytę
**Kroki:** Kliknij kafelek wizyty.
**Oczekiwany:** Przejście na `/panel/kominiarz/wizyta/:id`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-007: Wizyty — lista wszystkich
**Kroki:** „Wizyty" w menu.
**Oczekiwany:** Tabela z kolumnami Data / Adres / Typ / Status / Otwórz.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-008: Wizyty — filtry statusów
**Kroki:** Kliknij przyciski filtru: „Umówiona", „Zakończona", „Odwołana", „Odmowa wpuszczenia".
**Oczekiwany:** Tabela filtruje się; aktywny filtr ma ciemne tło.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-009: Detal wizyty — podgląd
**Kroki:** Wejdź w dowolną umówioną wizytę.

**Oczekiwany:**
- Adres + typ + data + status
- Formularz „Zakończ wizytę — protokół" z 3 przyciskami wyniku
- Pola na uwagi + zalecenia
- Przyciski „Zatwierdź protokół" / „Odmowa wpuszczenia"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-010: Zakończenie wizyty — happy path
**Priorytet:** krytyczny

**Kroki:**
1. Wybierz wynik „Sprawny"
2. Pole „usterki" zostaw puste
3. Wpisz „Następna kontrola za 12 m-cy" w zaleceniach
4. „Zatwierdź protokół"

**Oczekiwany:**
- Status wizyty zmienia się na „Zakończona"
- Pojawia się sekcja „Protokół" z wynikiem + podpisem kominiarza (jego imię + nr uprawnień)
- Mieszkaniec widzi protokół w „Historia kontroli"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-011: Zakończenie z usterką → auto-oferta upsell
**Priorytet:** krytyczny

**Kroki:**
1. Wejdź w inną umówioną wizytę
2. Wynik „Nieszczelny"
3. Usterki: „Pęknięcie wkładu na 2m"
4. Zalecenia: „Wymiana wkładu"
5. „Zatwierdź protokół"

**Oczekiwany:**
- Tip „Po zatwierdzeniu... system wygeneruje ofertę" jest widoczny przed kliknięciem
- Po zatwierdzeniu — w `/panel/kominiarz/oferty` jest **nowa oferta „Wymiana wkładu kominowego" 2800 zł** dla mieszkańca z tej wizyty

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-012: Odmowa wpuszczenia
**Kroki:** Otwórz wizytę → „Odmowa wpuszczenia" → potwierdź.
**Oczekiwany:** Status „Odmowa wpuszczenia"; po 2 odmowach z tego samego mieszkania NBA powinno wygenerować eskalację dla zarządcy.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-013: Klienci/Obiekty — lista
**Kroki:** „Obiekty / Klienci".
**Oczekiwany:** Karta „Spółdzielnie/wspólnoty" + tabela budynków z kolumnami Adres/Typ/Klient/Mieszkania.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-014: Detal budynku
**Kroki:** Klik „Szczegóły →" przy budynku.

**Oczekiwany:**
- Adres + typ + liczba mieszkań
- Tabela mieszkań z kolumną „Kod zaproszenia"
- Tabela przewodów (typ, paliwo, urządzenie, ost. kontrola, wkład, nasada)
- Tabela wizyt

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-015: NBA — lista akcji
**Kroki:** „Next Best Action".

**Oczekiwany:**
- Lista akcji posortowana po priorytecie (1 = najwyższy na górze)
- Każda akcja ma: badge typu, tytuł, uzasadnienie, adres, 2 przyciski „Zrobione" / „Pomiń"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-016: NBA — przelicz teraz
**Kroki:** „Przelicz teraz" w prawym górnym.
**Oczekiwany:** Lista odświeża się; może pojawić się dodatkowy log w Ustawieniach → Automatyzacja.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-017: NBA — oznaczenie „zrobione"
**Kroki:** Klik „Zrobione" przy dowolnej akcji.
**Oczekiwany:** Akcja znika z listy (status → done).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-018: NBA — „pomiń"
**Kroki:** „Pomiń" przy innej akcji.
**Oczekiwany:** Akcja znika z listy (status → dismissed).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-019: Oferty — lista i statystyki
**Kroki:** „Oferty / Upsell".
**Oczekiwany:** 4 karty statystyk + tabela ofert ze statusami badge.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-020: Oferty — ręczne utworzenie
**Kroki:** „+ Nowa oferta" → wypełnij i wyślij.
**Oczekiwany:** Modal zamyka się, nowa oferta na liście.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-021: Leady — lista
**Kroki:** „Leady" w menu.
**Oczekiwany:** Tabela wszystkich leadów (zarówno z formularza public, jak i wpisanych ręcznie).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-022: Leady — zmiana statusu
**Kroki:** W dropdownie statusu zmień „Nowy" na „Kontakt".
**Oczekiwany:** Zmiana zapisuje się natychmiast (zmiana koloru badge).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-023: Magic linki — lista
**Kroki:** „Magic linki" w menu kominiarza.
**Oczekiwany:** Tabela istniejących linków z kolumną statusu (Aktywny/Wygasły/Unieważniony).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-024: Magic linki — wygenerowanie nowego (z opcjami)
**Priorytet:** krytyczny

**Kroki:** „+ Wygeneruj link" → wypełnij imię, telefon, **wybierz zakres dat dostępnych slotów** i **dozwolone usługi** → „Wygeneruj".

**Oczekiwany:**
- Modal pokazuje gotowy link
- Link działa w incognito i widać tylko zadane sloty/usługi (patrz TC-MAGIC-006/007)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-025: Magic linki — kopiowanie do schowka
**Kroki:** Klik „Kopiuj" lub „Skopiuj".
**Oczekiwany:** Alert „Skopiowano!", URL trafia do schowka.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-026: Magic linki — unieważnienie
**Kroki:** „Unieważnij" przy aktywnym linku → potwierdź.
**Oczekiwany:** Status zmienia się na „Unieważniony".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-027: Ustawienia — Google Calendar (mock)
**Kroki:** „Ustawienia" → „Połącz z Google Calendar".
**Oczekiwany:**
- Status zmienia się na zielone „● Połączono (mock token)"
- Pojawia się przycisk „Rozłącz"

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-KOM-028: Ustawienia — uruchom automatyzację
**Kroki:** „Uruchom teraz" w sekcji Automatyzacja.
**Oczekiwany:** Pojawia się nowy wiersz w „Ostatnie wykonania".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
