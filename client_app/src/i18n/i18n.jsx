import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'vi', // ngôn ngữ mặc định
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // đường dẫn tới file JSON
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;