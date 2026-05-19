// Mini-i18n bez zewnętrznych zależności. Wybór języka w localStorage.
// Statyczne UI stringi w słowniku poniżej. Treść CMS tłumaczona serwerowo.
import { useEffect, useState } from 'react';

export const LANGUAGES = [
  { code: 'pl', label: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
];

export const DEFAULT_LANG = 'pl';
const LS_KEY = 'gs_lang';

// Auto-detect preferowanego języka z przeglądarki
function detectLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const stored = localStorage.getItem(LS_KEY);
  if (stored && LANGUAGES.some(l => l.code === stored)) return stored;
  const browser = (navigator.language || 'pl').toLowerCase().slice(0, 2);
  if (LANGUAGES.some(l => l.code === browser)) return browser;
  return DEFAULT_LANG;
}

let currentLang = typeof window === 'undefined' ? DEFAULT_LANG : detectLang();
const listeners = new Set();

export function getLang() { return currentLang; }
export function setLang(code) {
  if (!LANGUAGES.some(l => l.code === code)) return;
  currentLang = code;
  localStorage.setItem(LS_KEY, code);
  document.documentElement.lang = code;
  listeners.forEach(fn => fn(code));
}

export function useLang() {
  const [lang, _setLang] = useState(currentLang);
  useEffect(() => {
    const sub = (c) => _setLang(c);
    listeners.add(sub);
    return () => listeners.delete(sub);
  }, []);
  return [lang, setLang];
}

// =================== TŁUMACZENIA UI ===================
const STRINGS = {
  // Header
  'header.about': { pl: 'O Nas', en: 'About', uk: 'Про нас', ru: 'О нас', de: 'Über uns', vi: 'Giới thiệu' },
  'header.services': { pl: 'Usługi', en: 'Services', uk: 'Послуги', ru: 'Услуги', de: 'Leistungen', vi: 'Dịch vụ' },
  'header.team': { pl: 'Zespół', en: 'Team', uk: 'Команда', ru: 'Команда', de: 'Team', vi: 'Đội ngũ' },
  'header.contact': { pl: 'Kontakt', en: 'Contact', uk: 'Контакти', ru: 'Контакты', de: 'Kontakt', vi: 'Liên hệ' },
  'header.panel': { pl: 'Panel', en: 'Panel', uk: 'Панель', ru: 'Панель', de: 'Panel', vi: 'Bảng' },
  'header.book': { pl: 'Umów wizytę', en: 'Book visit', uk: 'Записатися', ru: 'Записаться', de: 'Termin buchen', vi: 'Đặt lịch' },
  'header.menu_open': { pl: 'Otwórz menu', en: 'Open menu', uk: 'Відкрити меню', ru: 'Открыть меню', de: 'Menü öffnen', vi: 'Mở menu' },

  // Hero
  'hero.default_title': { pl: 'Eksperci od Komina i Gazu', en: 'Chimney and Gas Experts', uk: 'Експерти з димоходів та газу', ru: 'Эксперты по дымоходам и газу', de: 'Experten für Schornsteine und Gas', vi: 'Chuyên gia ống khói và khí đốt' },
  'hero.contact_us': { pl: 'Skontaktuj się z nami', en: 'Contact us', uk: 'Зв\'язатися з нами', ru: 'Свяжитесь с нами', de: 'Kontaktieren Sie uns', vi: 'Liên hệ với chúng tôi' },

  // Services
  'services.eyebrow': { pl: 'Nasze Usługi', en: 'Our Services', uk: 'Наші послуги', ru: 'Наши услуги', de: 'Unsere Leistungen', vi: 'Dịch vụ của chúng tôi' },
  'services.title': { pl: 'Pełen zakres usług kominiarskich', en: 'Full range of chimney services', uk: 'Повний спектр послуг сажотруса', ru: 'Полный спектр услуг трубочиста', de: 'Vollständiges Angebot an Schornsteinfegerleistungen', vi: 'Toàn bộ dịch vụ vệ sinh ống khói' },

  // About
  'about.learn_more': { pl: 'Dowiedz się więcej', en: 'Learn more', uk: 'Дізнатися більше', ru: 'Узнать больше', de: 'Mehr erfahren', vi: 'Tìm hiểu thêm' },

  // CTA
  'cta.book_term': { pl: 'Zarezerwuj termin', en: 'Book appointment', uk: 'Забронювати дату', ru: 'Забронировать время', de: 'Termin reservieren', vi: 'Đặt lịch' },

  // Team
  'team.eyebrow': { pl: 'Nasz Zespół', en: 'Our Team', uk: 'Наша команда', ru: 'Наша команда', de: 'Unser Team', vi: 'Đội ngũ' },
  'team.title': { pl: 'Poznaj założycieli firmy', en: 'Meet the founders', uk: 'Познайомтеся із засновниками', ru: 'Познакомьтесь с основателями', de: 'Lernen Sie die Gründer kennen', vi: 'Gặp gỡ những người sáng lập' },
  'team.contact_via_form': { pl: 'Skontaktuj się przez formularz →', en: 'Contact via form →', uk: 'Зв\'яжіться через форму →', ru: 'Связаться через форму →', de: 'Über Formular kontaktieren →', vi: 'Liên hệ qua biểu mẫu →' },

  // Contact form
  'contact.eyebrow': { pl: 'Kontakt', en: 'Contact', uk: 'Контакти', ru: 'Контакты', de: 'Kontakt', vi: 'Liên hệ' },
  'contact.title': { pl: 'Umów wizytę lub zostaw kontakt', en: 'Book a visit or leave contact', uk: 'Запишіться або залиште контакт', ru: 'Запишитесь или оставьте контакт', de: 'Termin buchen oder Kontakt hinterlassen', vi: 'Đặt lịch hoặc để lại liên hệ' },
  'contact.subtitle': { pl: 'Oddzwonimy w ciągu 24h. Nic nie kosztuje.', en: 'We\'ll call back within 24h. No cost.', uk: 'Передзвонимо протягом 24 годин. Безкоштовно.', ru: 'Перезвоним в течение 24ч. Бесплатно.', de: 'Wir rufen innerhalb von 24 Std. zurück. Kostenlos.', vi: 'Chúng tôi sẽ gọi lại trong 24h. Miễn phí.' },
  'contact.name': { pl: 'Imię i nazwisko', en: 'Full name', uk: 'Ім\'я та прізвище', ru: 'Имя и фамилия', de: 'Vor- und Nachname', vi: 'Họ và tên' },
  'contact.phone': { pl: 'Telefon', en: 'Phone', uk: 'Телефон', ru: 'Телефон', de: 'Telefon', vi: 'Điện thoại' },
  'contact.email': { pl: 'E-mail (opcjonalnie)', en: 'E-mail (optional)', uk: 'E-mail (необов\'язково)', ru: 'E-mail (необязательно)', de: 'E-Mail (optional)', vi: 'Email (tùy chọn)' },
  'contact.service': { pl: 'Rodzaj usługi', en: 'Service type', uk: 'Тип послуги', ru: 'Тип услуги', de: 'Art der Leistung', vi: 'Loại dịch vụ' },
  'contact.message': { pl: 'Wiadomość (opcjonalnie)', en: 'Message (optional)', uk: 'Повідомлення (необов\'язково)', ru: 'Сообщение (необязательно)', de: 'Nachricht (optional)', vi: 'Lời nhắn (tùy chọn)' },
  'contact.message_ph': { pl: 'Opisz swój problem lub preferowany termin...', en: 'Describe your problem or preferred date...', uk: 'Опишіть вашу проблему або зручний час...', ru: 'Опишите вашу проблему или удобное время...', de: 'Beschreiben Sie Ihr Anliegen oder Wunschtermin...', vi: 'Mô tả vấn đề hoặc thời gian mong muốn...' },
  'contact.submit': { pl: 'Wyślij zapytanie', en: 'Send inquiry', uk: 'Надіслати запит', ru: 'Отправить запрос', de: 'Anfrage senden', vi: 'Gửi yêu cầu' },
  'contact.sending': { pl: 'Wysyłanie...', en: 'Sending...', uk: 'Надсилання...', ru: 'Отправка...', de: 'Wird gesendet...', vi: 'Đang gửi...' },
  'contact.success_title': { pl: 'Dziękujemy! Otrzymaliśmy zgłoszenie.', en: 'Thank you! We received your inquiry.', uk: 'Дякуємо! Ми отримали ваш запит.', ru: 'Спасибо! Мы получили вашу заявку.', de: 'Danke! Wir haben Ihre Anfrage erhalten.', vi: 'Cảm ơn! Chúng tôi đã nhận được yêu cầu.' },
  'contact.success_body': { pl: 'Skontaktujemy się z Państwem najszybciej jak to możliwe.', en: 'We will contact you as soon as possible.', uk: 'Ми зв\'яжемося з вами якомога швидше.', ru: 'Мы свяжемся с вами в ближайшее время.', de: 'Wir werden Sie schnellstmöglich kontaktieren.', vi: 'Chúng tôi sẽ liên hệ sớm nhất có thể.' },
  'contact.send_another': { pl: 'Wyślij kolejne zapytanie', en: 'Send another inquiry', uk: 'Надіслати ще запит', ru: 'Отправить ещё запрос', de: 'Weitere Anfrage senden', vi: 'Gửi yêu cầu khác' },
  'contact.consent': { pl: 'Wysyłając formularz wyrażasz zgodę na kontakt telefoniczny w sprawie zapytania.', en: 'By submitting, you consent to be contacted by phone regarding this inquiry.', uk: 'Надсилаючи форму, ви даєте згоду на зв\'язок телефоном.', ru: 'Отправляя форму, вы соглашаетесь на телефонную связь.', de: 'Mit dem Absenden stimmen Sie der telefonischen Kontaktaufnahme zu.', vi: 'Khi gửi, bạn đồng ý cho phép liên hệ qua điện thoại.' },
  'contact.logged_in_as': { pl: 'Jesteś zalogowany jako', en: 'You are logged in as', uk: 'Ви увійшли як', ru: 'Вы вошли как', de: 'Sie sind angemeldet als', vi: 'Bạn đã đăng nhập với tên' },
  'contact.prefilled': { pl: 'Twoje dane są wstępnie wypełnione.', en: 'Your data is pre-filled.', uk: 'Ваші дані заповнені попередньо.', ru: 'Ваши данные предзаполнены.', de: 'Ihre Daten sind vorausgefüllt.', vi: 'Dữ liệu của bạn đã được điền sẵn.' },
  'contact.book_panel': { pl: 'umów wizytę bezpośrednio w panelu', en: 'book a visit directly in the panel', uk: 'записатися безпосередньо в панелі', ru: 'записаться прямо в панели', de: 'direkt im Panel buchen', vi: 'đặt lịch trực tiếp trong bảng' },

  // Service types
  'svc.kontrola': { pl: 'Kontrola okresowa przewodów', en: 'Periodic inspection', uk: 'Періодична перевірка', ru: 'Периодическая проверка', de: 'Periodische Inspektion', vi: 'Kiểm tra định kỳ' },
  'svc.czyszczenie': { pl: 'Czyszczenie przewodów', en: 'Chimney cleaning', uk: 'Чищення димоходу', ru: 'Чистка дымохода', de: 'Schornsteinreinigung', vi: 'Vệ sinh ống khói' },
  'svc.gaz': { pl: 'Kontrola instalacji gazowej', en: 'Gas installation check', uk: 'Перевірка газової установки', ru: 'Проверка газовой установки', de: 'Gasanlagenprüfung', vi: 'Kiểm tra khí gas' },
  'svc.inspekcja_kamera': { pl: 'Inspekcja kamerą', en: 'Camera inspection', uk: 'Інспекція камерою', ru: 'Инспекция камерой', de: 'Kamerainspektion', vi: 'Kiểm tra bằng camera' },
  'svc.montaz_wkladu': { pl: 'Montaż wkładu kominowego', en: 'Chimney liner installation', uk: 'Встановлення димоходу', ru: 'Установка вкладыша', de: 'Schornstein-Innenrohr', vi: 'Lắp ống lót' },
  'svc.montaz_nasady': { pl: 'Montaż nasady', en: 'Cap installation', uk: 'Встановлення насадки', ru: 'Установка насадки', de: 'Schornsteinaufsatz', vi: 'Lắp nắp' },
  'svc.opinia': { pl: 'Opinia kominiarska', en: 'Chimney sweep opinion', uk: 'Висновок сажотруса', ru: 'Заключение трубочиста', de: 'Schornsteinfegergutachten', vi: 'Báo cáo kiểm tra' },
  'svc.inne': { pl: 'Inne', en: 'Other', uk: 'Інше', ru: 'Другое', de: 'Sonstiges', vi: 'Khác' },

  // Footer
  'footer.tagline': { pl: 'Profesjonalne usługi kominiarskie, gazowe i instalacyjne. Garwolin i okolice.', en: 'Professional chimney, gas and installation services. Garwolin and area.', uk: 'Професійні послуги сажотруса, газові та монтажні. Гарволін і околиці.', ru: 'Профессиональные услуги трубочиста, газовые и монтажные. Гарволин и окрестности.', de: 'Professionelle Schornsteinfeger-, Gas- und Installationsdienste. Garwolin und Umgebung.', vi: 'Dịch vụ vệ sinh ống khói, khí gas và lắp đặt chuyên nghiệp. Garwolin và vùng lân cận.' },
  'footer.quick_links': { pl: 'Szybkie linki', en: 'Quick links', uk: 'Швидкі посилання', ru: 'Быстрые ссылки', de: 'Schnellzugriff', vi: 'Liên kết nhanh' },
  'footer.about_company': { pl: 'O firmie', en: 'About company', uk: 'Про компанію', ru: 'О компании', de: 'Über uns', vi: 'Về công ty' },
  'footer.chimney_services': { pl: 'Usługi kominiarskie', en: 'Chimney services', uk: 'Послуги сажотруса', ru: 'Услуги трубочиста', de: 'Schornsteinfegerleistungen', vi: 'Dịch vụ ống khói' },
  'footer.gas_installations': { pl: 'Instalacje gazowe', en: 'Gas installations', uk: 'Газові установки', ru: 'Газовые установки', de: 'Gasanlagen', vi: 'Lắp đặt khí gas' },
  'footer.book_visit': { pl: 'Umów wizytę', en: 'Book a visit', uk: 'Записатися', ru: 'Записаться', de: 'Termin buchen', vi: 'Đặt lịch' },
  'footer.contact': { pl: 'Kontakt', en: 'Contact', uk: 'Контакти', ru: 'Контакты', de: 'Kontakt', vi: 'Liên hệ' },
  'footer.hours': { pl: 'Godziny otwarcia', en: 'Opening hours', uk: 'Години роботи', ru: 'Часы работы', de: 'Öffnungszeiten', vi: 'Giờ làm việc' },
  'footer.privacy': { pl: 'Polityka prywatności', en: 'Privacy policy', uk: 'Політика конфіденційності', ru: 'Политика конфиденциальности', de: 'Datenschutz', vi: 'Chính sách bảo mật' },
  'footer.terms': { pl: 'Regulamin', en: 'Terms', uk: 'Правила', ru: 'Условия', de: 'AGB', vi: 'Điều khoản' },
  'footer.copyright': { pl: 'Wszelkie prawa zastrzeżone.', en: 'All rights reserved.', uk: 'Усі права захищені.', ru: 'Все права защищены.', de: 'Alle Rechte vorbehalten.', vi: 'Đã đăng ký bản quyền.' },

  // Game ogólne
  'game.eyebrow': { pl: 'Mistrz Kominiarski', en: 'Master Chimney Sweep', uk: 'Майстер сажотрус', ru: 'Мастер трубочист', de: 'Meister Schornsteinfeger', vi: 'Thợ quét ống khói bậc thầy' },
  'game.title': { pl: 'Oczyść Wkłady Kominowe', en: 'Clean the Chimney Liners', uk: 'Очисти димоходи', ru: 'Очисти дымоходы', de: 'Reinige die Schornsteinrohre', vi: 'Vệ sinh ống lót' },
  'game.description': { pl: 'Kula spuszcza się bez zatrzymania! Obracaj stalowe wkłady (klikając) zanim kominiarz z dachu napotka zator. Przeprowadź szczotkę prosto do kominka!', en: 'The ball drops without stopping! Rotate the steel liners (by clicking) before the chimney sweep from the roof hits a blockage. Guide the brush straight to the fireplace!', uk: 'Куля падає без зупинки! Обертайте сталеві димоходи (клацанням), перш ніж сажотрус з даху натрапить на затор. Проведіть щітку прямо до каміна!', ru: 'Шар опускается без остановки! Поворачивайте стальные вкладыши (нажатием), пока трубочист с крыши не наткнётся на затор. Проведите щётку прямо к камину!', de: 'Die Kugel fällt ungebremst! Drehen Sie die Stahlrohre (durch Klicken), bevor der Schornsteinfeger vom Dach auf eine Blockade trifft. Führen Sie die Bürste direkt zum Kamin!', vi: 'Quả bóng rơi không ngừng! Xoay các ống lót thép (bằng cách nhấp) trước khi thợ quét ống khói từ mái nhà gặp tắc nghẽn. Hướng dẫn bàn chải thẳng đến lò sưởi!' },
  'game.level': { pl: 'Poziom', en: 'Level', uk: 'Рівень', ru: 'Уровень', de: 'Stufe', vi: 'Cấp độ' },
  'game.points': { pl: 'Punkty', en: 'Points', uk: 'Бали', ru: 'Очки', de: 'Punkte', vi: 'Điểm' },
  'game.start_in': { pl: 'START ZA:', en: 'START IN:', uk: 'СТАРТ ЧЕРЕЗ:', ru: 'СТАРТ ЧЕРЕЗ:', de: 'START IN:', vi: 'BẮT ĐẦU SAU:' },
  'game.cleaning': { pl: 'CZYSZCZENIE!', en: 'CLEANING!', uk: 'ЧИЩЕННЯ!', ru: 'ЧИСТКА!', de: 'REINIGUNG!', vi: 'ĐANG VỆ SINH!' },
  'game.alt_roof': { pl: 'Kominiarz na dachu', en: 'Chimney sweep on roof', uk: 'Сажотрус на даху', ru: 'Трубочист на крыше', de: 'Schornsteinfeger auf dem Dach', vi: 'Thợ quét ống khói trên mái' },
  'game.alt_fireplace': { pl: 'Kominek', en: 'Fireplace', uk: 'Камін', ru: 'Камин', de: 'Kamin', vi: 'Lò sưởi' },
  'game.failed_title': { pl: 'Zator w Kominie!', en: 'Chimney Blockage!', uk: 'Затор у димоході!', ru: 'Затор в дымоходе!', de: 'Schornstein verstopft!', vi: 'Ống khói bị tắc!' },
  'game.failed_message': { pl: 'Szczotka utknęła. System rur kominowych nie jest drożny!', en: 'The brush got stuck. The chimney system is not clear!', uk: 'Щітка застрягла. Система димоходів не прохідна!', ru: 'Щётка застряла. Система дымоходов не проходима!', de: 'Die Bürste hat sich verklemmt. Das Rohrsystem ist nicht frei!', vi: 'Bàn chải bị kẹt. Hệ thống ống khói không thông!' },
  'game.retry': { pl: 'Rozkuj ścianę i powtórz', en: 'Break the wall and retry', uk: 'Розбий стіну та повтори', ru: 'Разломай стену и повтори', de: 'Wand aufbrechen und erneut', vi: 'Phá tường và thử lại' },
  'game.solved_title': { pl: 'Komin Drożny!', en: 'Chimney Cleared!', uk: 'Димохід чистий!', ru: 'Дымоход прочищен!', de: 'Schornstein frei!', vi: 'Ống khói thông rồi!' },
  'game.solved_message': { pl: 'Rewelacyjna robota. Wkład wyczyszczony. Komin jest gotowy do sezonu.', en: 'Brilliant work. Liner cleaned. The chimney is ready for the season.', uk: 'Чудова робота. Димохід очищено. Готовий до сезону.', ru: 'Отличная работа. Дымоход очищен. Готов к сезону.', de: 'Großartige Arbeit. Schornstein gereinigt. Bereit für die Saison.', vi: 'Tuyệt vời. Ống khói đã sạch. Sẵn sàng cho mùa mới.' },
  'game.next_order': { pl: 'Kolejne Zlecenie', en: 'Next Order', uk: 'Наступне замовлення', ru: 'Следующий заказ', de: 'Nächster Auftrag', vi: 'Đơn hàng tiếp' },
  'game.click_to_start': { pl: 'KLIKNIJ RURĘ ABY ZACZĄĆ', en: 'CLICK A PIPE TO START', uk: 'НАТИСНИ ТРУБУ ЩОБ ПОЧАТИ', ru: 'НАЖМИ ТРУБУ ЧТОБЫ НАЧАТЬ', de: 'KLICKE ROHR ZUM STARTEN', vi: 'NHẤP VÀO ỐNG ĐỂ BẮT ĐẦU' },

  // Common
  'common.required': { pl: 'wymagane', en: 'required', uk: 'обов\'язково', ru: 'обязательно', de: 'erforderlich', vi: 'bắt buộc' },
  'common.loading': { pl: 'Ładowanie...', en: 'Loading...', uk: 'Завантаження...', ru: 'Загрузка...', de: 'Wird geladen...', vi: 'Đang tải...' },
};

export function t(key, lang = currentLang) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry[DEFAULT_LANG] || key;
}

export function useT() {
  const [lang] = useLang();
  return (key) => t(key, lang);
}
