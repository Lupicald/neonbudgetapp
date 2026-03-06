import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, es, LanguageCode, TranslationKey } from '../services/i18n';
import { getSetting, setSetting } from '../database/settingsService';

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => en[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLang] = useState<LanguageCode>('en');

    useEffect(() => {
        getSetting('language').then(val => {
            if (val === 'es' || val === 'en') {
                setLang(val);
            }
        });
    }, []);

    const setLanguage = async (lang: LanguageCode) => {
        setLang(lang);
        await setSetting('language', lang);
    };

    const t = (key: TranslationKey): string => {
        const dict = language === 'es' ? es : en;
        return dict[key] || en[key] || key; // Fallback to english or key
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
