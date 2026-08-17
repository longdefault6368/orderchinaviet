'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
    __changeGoogleLanguage?: (locale: string) => void;
  }
}

export function GoogleTranslateProvider() {
  const pathname = usePathname();
  const initializedRef = useRef(false);

  const getGoogleLangCode = (locale: string) => {
    switch (locale) {
      case 'zh':
        return 'zh-CN';
      case 'en':
        return 'en';
      case 'vi':
      default:
        return 'vi';
    }
  };

  const setGoogleCookies = (targetLang: string) => {
    if (typeof window === 'undefined') return;
    const domain = window.location.hostname;

    if (targetLang === 'vi') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=/vi/vi; path=/;';
      document.cookie = 'googtrans=/auto/vi; path=/;';
      if (domain && domain !== 'localhost') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
      }
    } else {
      document.cookie = `googtrans=/auto/${targetLang}; path=/;`;
      document.cookie = `googtrans=/vi/${targetLang}; path=/;`;
      if (domain && domain !== 'localhost') {
        document.cookie = `googtrans=/auto/${targetLang}; path=/; domain=${domain};`;
        document.cookie = `googtrans=/vi/${targetLang}; path=/; domain=${domain};`;
        document.cookie = `googtrans=/auto/${targetLang}; path=/; domain=.${domain};`;
        document.cookie = `googtrans=/vi/${targetLang}; path=/; domain=.${domain};`;
      }
    }
  };

  const triggerGoogleSelect = (targetLang: string) => {
    if (typeof window === 'undefined') return false;
    const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectElem) {
      const val = targetLang === 'vi' ? '' : targetLang;
      if (selectElem.value !== val) {
        selectElem.value = val;
        selectElem.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  const applyTranslation = (locale: string) => {
    const targetLang = getGoogleLangCode(locale);
    setGoogleCookies(targetLang);

    if (!triggerGoogleSelect(targetLang)) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (triggerGoogleSelect(targetLang) || attempts >= 15) {
          clearInterval(interval);
        }
      }, 200);
    }
  };

  // Completely suppress top banner and prevent body shift down
  const cleanGoogleTranslateUI = () => {
    if (typeof document === 'undefined') return;

    if (document.body) {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.body.style.position === 'relative') {
        document.body.style.position = 'static';
      }
    }

    // Remove or hide any popup iframes that Google attempts to insert
    const popupSelectors = [
      '.goog-te-banner-frame',
      'iframe.goog-te-banner-frame',
      'iframe.skiptranslate',
      '.VIpgJd-ZVi9od-ORHb-OEVmcd',
      '#goog-gt-tt',
      '.goog-te-balloon-frame',
    ];

    popupSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
        (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        (el as HTMLElement).style.setProperty('height', '0px', 'important');
      });
    });
  };

  useEffect(() => {
    window.__changeGoogleLanguage = (locale: string) => {
      applyTranslation(locale);
    };

    // Clean UI immediately and watch for any mutation by Google script
    cleanGoogleTranslateUI();
    const observer = new MutationObserver(() => {
      cleanGoogleTranslateUI();
    });

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
      });
    }

    if (initializedRef.current) return () => observer.disconnect();
    initializedRef.current = true;

    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'vi',
              includedLanguages: 'vi,zh-CN,en',
              autoDisplay: false,
              layout: 0,
            },
            'google_translate_element'
          );

          const currentLocale = pathname?.split('/')[1] || 'vi';
          setTimeout(() => {
            applyTranslation(currentLocale);
            cleanGoogleTranslateUI();
          }, 300);
        }
      } catch (err) {
        console.error('Google Translate Init Error:', err);
      }
    };

    const existingScript = document.getElementById('google-translate-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const currentLocale = pathname?.split('/')[1] || 'vi';
    applyTranslation(currentLocale);
    cleanGoogleTranslateUI();
  }, [pathname]);

  return (
    <div
      id="google_translate_element"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
}
