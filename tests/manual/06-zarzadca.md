# 06 — Panel zarządcy / spółdzielni

Logowanie: `zarzadca@spoldzielnia.pl` / `demo1234`.

---

## TC-ZAR-001: Dashboard — statystyki
**Oczekiwany:** 3 karty:
- „Spółdzielnie/Wspólnoty" — 1
- „Otwarte eskalacje" — 0 lub więcej
- „Zgłoszenia mieszkańców" — liczba otwartych

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-002: Lista organizacji zarządcy
**Oczekiwany:** Sekcja „Twoje organizacje" pokazuje „SM «Słoneczna»" z 2 budynkami.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-003: Akcje wymagające uwagi (NBA)
**Oczekiwany:** Sekcja „Akcje wymagające Twojej uwagi" — jeśli są eskalacje, są tutaj.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-004: Najnowsze zgłoszenia mieszkańców
**Oczekiwany:** Sekcja „Najnowsze zgłoszenia" pokazuje zgłoszenia wszystkich mieszkańców (nie tylko zarządcy).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-005: Obiekty — lista ze statusem terminów
**Priorytet:** krytyczny

**Kroki:** „Obiekty".

**Oczekiwany:**
- Tabela per spółdzielnia
- Każdy budynek ma badge statusu:
  - **„w terminie"** (zielony) — gdy ost. kontrola < 270 dni temu
  - **„< 90 dni do terminu"** (żółty) — gdy 270 ≤ days < 330
  - **„termin zbliża się / minął"** (czerwony) — gdy days > 330

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-006: Obiekty — wszystkie kolumny
**Oczekiwany:** Adres, liczba mieszkań, liczba przewodów, data ostatniej kontroli, status badge, liczba wizyt.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-007: Raporty — statystyki
**Kroki:** „Raporty".
**Oczekiwany:** 3 karty: wykonane kontrole / odmowy / łącznie wizyt + tabela wszystkich wizyt.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-008: Raporty — eksport CSV
**Priorytet:** wysoki

**Kroki:** „Eksport CSV".

**Oczekiwany:**
- Pobiera się plik `raport-YYYY-MM-DD.csv`
- Plik zawiera kolumny: Data, Adres, Lokal, Typ, Status
- Polskie znaki poprawnie zakodowane (otwórz w Excel/Numbers)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-ZAR-009: Zarządca nie widzi cudzych spółdzielni
**Kroki:** Sprawdź czy zarządca SM «Słoneczna» widzi w `/obiekty` budynki z „Wspólnoty Kwiatowa 4".
**Oczekiwany:** Widzi tylko swoje (zgodnie z `contact_id` w `cooperatives`).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
