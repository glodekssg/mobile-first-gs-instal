# Szablon zgłoszenia błędu

Skopiuj poniższy szablon dla każdego znalezionego buga.

---

## BUG-NNN: [krótki tytuł]

**Powiązany test case:** TC-XXX-NNN
**Priorytet:** krytyczny | wysoki | średni | niski
**Środowisko:**
- OS: macOS 14 / Win 11 / Linux ...
- Przeglądarka: Chrome 124 / Firefox 125 / Safari 17 ...
- Rozdzielczość: 1920×1080 / mobile

**Kroki reprodukcji:**
1. ...
2. ...
3. ...

**Rzeczywisty rezultat:**
...

**Oczekiwany rezultat:**
...

**Załączniki:**
- screenshot: link/ścieżka
- log konsoli (F12 → Console): ...
- log serwera: ...

---

## Przykład

## BUG-001: Header zasłania przycisk „Zaloguj się"

**Powiązany TC:** TC-PUB-007
**Priorytet:** krytyczny
**Środowisko:** macOS 14.4, Chrome 124, 1920×1080

**Kroki:**
1. Otwórz http://localhost:5174
2. Spróbuj kliknąć przycisk „Panel" w prawym górnym

**Rzeczywisty:** Klik nie aktywuje akcji — Header pochłania kliknięcie.

**Oczekiwany:** Przekierowanie na /login.

**Załączniki:** F12 → Computed → element ma z-index 50, Header też 50, kolejność DOM → Header wygrywa.
