# 10 — Automatyzacja, NBA, powiadomienia, oferty

---

## TC-AUTO-001: NBA generuje akcje po seed
**Priorytet:** krytyczny

**Warunki wstępne:** Świeży `npm run seed`.

**Kroki:** Zaloguj się jako kominiarz → „Next Best Action".

**Oczekiwany:** Lista zawiera co najmniej 5 akcji, w tym:
- „Umów kontrolę: ul. Słoneczna 1 / 3" (priorytet 20)
- „Upsell nasada: ..." (priorytet 40)
- „Follow-up oferty: Inspekcja kamerą..." (priorytet 45)
- „Eskalacja: powtarzająca się odmowa wpuszczenia" (priorytet 10)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-002: NBA — reguła „zaległe kontrole"
**Kroki:** W panelu admina/danych zmień `last_inspection` przewodu na 2 lata wstecz (lub usuń) → kominiarz: „Przelicz teraz".
**Oczekiwany:** Pojawia się nowa akcja `umow_kontrole` dla tego budynku.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-003: NBA — reguła „kocioł gazowy bez nasady"
**Kroki:** W panelu danych dodaj nowy przewód: typ spalinowy, paliwo gaz, urządzenie kocioł gazowy, **bez nasady** → kominiarz: „Przelicz".
**Oczekiwany:** Akcja `wyslij_oferte_nasada` pojawia się.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-004: NBA — deduplikacja
**Kroki:** „Przelicz teraz" 3 razy z rzędu.
**Oczekiwany:** Liczba akcji nie rośnie (deduplikacja po `target_role` + `action_type` + `apartment_id`).
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-005: Automatyzacja — uruchom manualnie
**Kroki:** Ustawienia → „Uruchom teraz".
**Oczekiwany:**
- Wpis w „Ostatnie wykonania" z timestampem i `outcome`
- W „Powiadomienia" mogą się pojawić nowe wpisy (SMS-y/emaile mock)

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-006: Powiadomienia — po rezerwacji wizyty
**Priorytet:** wysoki

**Kroki:**
1. Mieszkaniec rezerwuje wizytę (TC-RES-008)
2. Wyloguj, zaloguj jako kominiarz → Ustawienia → Powiadomienia

**Oczekiwany:** Wpis „[in_app] Nowa wizyta — Wizyta umówiona na ..." dla kominiarza i potwierdzenie email dla mieszkańca.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-007: Oferta — auto-utworzenie po protokole z usterką
**Priorytet:** krytyczny

**Kroki:** Wykonaj TC-KOM-011 (protokół „Nieszczelny").

**Oczekiwany:** W `/panel/kominiarz/oferty` jest nowa oferta typu „wklad", cena 2800 zł, target_profile_id = mieszkaniec z tej wizyty.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-008: Oferta — akceptacja tworzy wizytę realizacyjną
**Kroki:** Mieszkaniec akceptuje ofertę (TC-RES-012).
**Oczekiwany:** Tworzy się nowa wizyta typu `montaz_wkladu` umówiona za ~7 dni.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-009: Oferta — automatyczne wygaszanie
**Kroki:** W bazie zmień `expires_at` oferty na datę z przeszłości (lub poczekaj) → uruchom automatyzację.
**Oczekiwany:** Status oferty zmienia się z `wyslana` na `wygasla`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-010: NBA — eskalacja po 2 odmowach wpuszczenia
**Kroki:** Dla tego samego mieszkania oznacz 2 wizyty jako „Odmowa wpuszczenia" → „Przelicz".
**Oczekiwany:** Pojawia się akcja `eskalacja_odmowa` z `target_role='zarzadca'`, priorytet 10.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-011: NBA — follow-up oferty
**Kroki:** Oferta wystawiona 8 dni temu, status `wyslana` → „Przelicz".
**Oczekiwany:** Akcja `follow_up_oferta` dla kominiarza.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-012: NBA — reguła post-sezon (zima)
**Warunki:** Aktualny miesiąc to **kwiecień lub maj** (sprawdź; jeśli nie — pomiń).
**Kroki:** „Przelicz teraz".
**Oczekiwany:** Dla mieszkańców z paliwem stałym pojawia się akcja `czyszczenie_po_sezonie`.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-013: Lead → konwersja w panelu
**Kroki:**
1. Public form: wyślij zapytanie (TC-PUB-015)
2. Admin → Leady: zmień status na „Klient"
3. Manualnie utwórz konto mieszkańca dla tego leada
4. Magic link

**Oczekiwany:** Cały lifecycle przejdzie bezbłędnie; audit log ma odpowiednie wpisy.

**Status:** [ ] PASS  [ ] FAIL — uwagi: ___

---

## TC-AUTO-014: Cron działa w tle
**Kroki:** W serwerze sprawdź log (terminal). Cron jest ustawiony na 7:00 codziennie.
**Oczekiwany:** Jeśli akurat masz 7:00 — pojawia się log „[cron] running automation". Jeśli nie — pomiń.
**Status:** [ ] PASS  [ ] FAIL — uwagi: ___
