'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getTelegramWebApp,
  isTelegramWebApp,
  getTelegramUser,
  initTelegramWebApp,
  triggerHaptic,
  setupTelegramBackButton,
  type TelegramUser,
} from '@/lib/telegram/webapp';

interface TelegramContextType {
  isTelegram: boolean;
  user: TelegramUser | null;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => void;
  setBackButton: (visible: boolean, onClick?: () => void) => void;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegram: false,
  user: null,
  triggerHaptic: () => {},
  setBackButton: () => {},
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Telegram WebApp SDK is available
    const tg = getTelegramWebApp();
    if (tg) {
      initTelegramWebApp({
        headerColor: '#070d18',
        backgroundColor: '#070d18',
      });

      const tgUser = getTelegramUser();
      if (tgUser) {
        setUser(tgUser);
        setIsTelegram(true);
        document.body.classList.add('is-telegram-webapp');
      } else if (isTelegramWebApp()) {
        setIsTelegram(true);
        document.body.classList.add('is-telegram-webapp');
      }
    }
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        isTelegram,
        user,
        triggerHaptic,
        setBackButton: setupTelegramBackButton,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
