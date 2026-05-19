# Test cases — GS Instal CRM (testy manualne)

> Dokumentacja dla **zewnętrznego testera manualnego**.
> Cel: pełna weryfikacja funkcjonalna systemu krok po kroku.

## Spis treści

| # | Plik | Zakres | Liczba TC |
|---|------|--------|-----------|
| 00 | [setup.md](00-setup.md) | Przygotowanie środowiska | 4 |
| 01 | [public-site.md](01-public-site.md) | Strona publiczna (Hero, Services, Team, Footer, formularz) | 18 |
| 02 | [auth.md](02-auth.md) | Logowanie, rejestracja, OAuth, wylogowanie | 14 |
| 03 | [magic-link.md](03-magic-link.md) | Prospect — magic link bez logowania | 16 |
| 04 | [resident.md](04-resident.md) | Panel mieszkańca | 15 |
| 05 | [kominiarz.md](05-kominiarz.md) | Panel kominiarza | 28 |
| 06 | [zarzadca.md](06-zarzadca.md) | Panel zarządcy / spółdzielni | 9 |
| 07 | [admin-users.md](07-admin-users.md) | Admin — zarządzanie użytkownikami | 12 |
| 08 | [admin-cms.md](08-admin-cms.md) | Admin — CMS treści strony | 14 |
| 09 | [admin-data.md](09-admin-data.md) | Admin — dane biznesowe (spółdzielnie, budynki, lokale, przewody) | 16 |
| 10 | [automation.md](10-automation.md) | NBA, cron, automatyzacje, powiadomienia, oferty | 14 |
| 11 | [edge-cases.md](11-edge-cases.md) | Przypadki brzegowe, walidacja, bezpieczeństwo | 18 |
| — | [BUGS.md](BUGS.md) | Szablon do zgłaszania błędów | — |

**Razem: ~178 przypadków testowych**

## Konwencja

Każdy przypadek testowy ma format:

```
### TC-XXX-NNN: Krótki opis
**Priorytet:** krytyczny | wysoki | średni | niski
**Warunki wstępne:** ...
**Kroki:**
  1. ...
  2. ...
**Oczekiwany rezultat:** ...
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
```

### Priorytety
- **Krytyczny** — błąd blokuje używanie systemu (login nie działa, dane się gubią, błąd 500 na głównej ścieżce)
- **Wysoki** — błąd uderza w główną funkcjonalność (kominiarz nie może zakończyć wizyty, mieszkaniec nie może zarezerwować)
- **Średni** — UX/wygoda (np. coś się źle wyświetla na mobile, ale daje się obejść)
- **Niski** — kosmetyka (literówki, marginesy, kolory)

### Konwencja ID
- `TC-PUB-NNN` — public site
- `TC-AUTH-NNN` — auth
- `TC-MAGIC-NNN` — magic link / prospect
- `TC-RES-NNN` — resident (mieszkaniec)
- `TC-KOM-NNN` — kominiarz
- `TC-ZAR-NNN` — zarządca
- `TC-ADM-NNN` — admin
- `TC-CMS-NNN` — CMS
- `TC-DATA-NNN` — dane biznesowe (admin)
- `TC-AUTO-NNN` — automatyzacja
- `TC-EDGE-NNN` — edge case

## Konta demo (hasło: `demo1234`)

| Rola | Email |
|---|---|
| Administrator | `admin@gs-instal.pl` |
| Kominiarz | `mistrz@gs-instal.pl` |
| Zarządca | `zarzadca@spoldzielnia.pl` |
| Mieszkaniec | `marek@example.com` |
| Mieszkaniec | `kasia@example.com` |
| Mieszkaniec | `piotr@example.com` |

## Kody zaproszeń mieszkań (do TC-RES-001)
`CODE1` `CODE2` `CODE3` `CODE4` `HOMECODE`

## Jak raportować błąd

Wypełnij szablon w [BUGS.md](BUGS.md) — każdy bug osobno, z numerem powiązanego TC.
