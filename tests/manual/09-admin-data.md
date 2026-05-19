# 09 — Admin: dane biznesowe (spółdzielnie, budynki, lokale, przewody)

Funkcjonalność CRUD dla danych operacyjnych — dostępna **tylko dla admina**.

Logowanie: `admin@gs-instal.pl` / `demo1234`. Wejdź `/panel/admin/dane`.

---

## TC-DATA-001: Strona „Dane biznesowe" — dostęp
**Priorytet:** krytyczny

**Oczekiwany:** Strona dostępna z menu admina; widać 4 zakładki: Spółdzielnie • Budynki • Mieszkania • Przewody.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-002: Lista spółdzielni
**Oczekiwany:** Tabela z kolumnami Nazwa / NIP / Adres / Liczba budynków + przyciski Edytuj/Usuń.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-003: Utworzenie nowej spółdzielni
**Priorytet:** wysoki

**Kroki:** „+ Nowa spółdzielnia" → wypełnij nazwę „Test SM Tulipan", NIP `1234567890`, adres „ul. Test 1" → zapisz.

**Oczekiwany:** Pojawia się na liście. Tworzony też w panelu kominiarza w „Klienci".
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-004: Edycja spółdzielni
**Kroki:** „Edytuj" przy nowej spółdzielni → zmień nazwę.
**Oczekiwany:** Zmiana widoczna na liście.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-005: Powiązanie zarządcy ze spółdzielnią
**Kroki:** W edycji spółdzielni wybierz z dropdown'a istniejące konto zarządcy.
**Oczekiwany:** Po zapisie wybrany zarządca widzi tę spółdzielnię w swoim panelu.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-006: Usunięcie spółdzielni
**Kroki:** „Usuń" przy testowej spółdzielni → potwierdź.
**Oczekiwany:** Spółdzielnia znika; powiązane budynki tracą `cooperative_id` (NULL).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-007: Lista budynków
**Kroki:** Zakładka „Budynki".
**Oczekiwany:** Tabela ze wszystkimi budynkami + przyciski CRUD.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-008: Utworzenie budynku
**Priorytet:** wysoki

**Kroki:** „+ Nowy budynek" → wybierz spółdzielnię, adres, miasto, kod, typ, liczba mieszkań → zapisz.
**Oczekiwany:** Budynek na liście; pojawia się też w panelach kominiarza i zarządcy.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-009: Edycja budynku
**Kroki:** Zmień typ z „wielorodzinny" na „jednorodzinny".
**Oczekiwany:** Zmiana zapisana.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-010: Lista mieszkań
**Kroki:** Zakładka „Mieszkania".
**Oczekiwany:** Filtruj po budynku; tabela: Numer / Piętro / Mieszkaniec / Kod zaproszenia.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-011: Utworzenie mieszkania
**Kroki:** „+ Nowe mieszkanie" → wybierz budynek, podaj numer „99", piętro „4" → zapisz.
**Oczekiwany:** Mieszkanie tworzy się **z automatycznie wygenerowanym kodem zaproszenia** (np. ABCD1234).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-012: Regeneracja kodu zaproszenia
**Kroki:** „Regeneruj kod" przy mieszkaniu.
**Oczekiwany:** Pojawia się nowy kod; stary przestaje działać.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-013: Lista przewodów
**Kroki:** Zakładka „Przewody".
**Oczekiwany:** Tabela: Adres / Lokal / Typ przewodu / Paliwo / Urządzenie / Wkład / Nasada / Ost. kontrola.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-014: Dodanie nowego przewodu
**Priorytet:** wysoki

**Kroki:** „+ Nowy przewód" → wybierz budynek+mieszkanie, typ „dymowy", paliwo „stałe", urządzenie „kominek" → zapisz.
**Oczekiwany:** Przewód na liście; NBA na nowo go uwzględnia (po przeliczeniu).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-015: Edycja przewodu — oznaczenie zamontowania nasady
**Kroki:** „Edytuj" przy przewodzie bez nasady → zaznacz „Ma nasadę" → zapisz.
**Oczekiwany:** NBA przestaje sugerować upsell nasady dla tego przewodu (po Przelicz).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-DATA-016: Usunięcie przewodu
**Kroki:** Usuń testowy przewód.
**Oczekiwany:** Znika z listy, znika z bazy przewodów budynku.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
