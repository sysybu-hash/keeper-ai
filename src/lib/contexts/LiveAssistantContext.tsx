"use client";

import React, { createContext, useContext, useState } from 'react';
import { LiveAssistant } from '@/components/LiveAssistant';

export interface DocumentContextData {
  id: string;
  originalFilename: string;
  summary?: string;
  full_ocr_text?: string;
}

interface LiveAssistantContextType {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  setContextData: (data: DocumentContextData | null) => void;
  contextData: DocumentContextData | null;
}

const LiveAssistantContext = createContext<LiveAssistantContextType | undefined>(undefined);

export const LiveAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextData, setContextData] = useState<DocumentContextData | null>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <LiveAssistantContext.Provider value={{ open, close, isOpen, setContextData, contextData }}>
      {children}
      <LiveAssistant isOpen={isOpen} onClose={close} />
    </LiveAssistantContext.Provider>
  );
};

export const useLiveAssistant = () => {
  const context = useContext(LiveAssistantContext);
  if (!context) {
    throw new Error('useLiveAssistant must be used within a LiveAssistantProvider');
  }
  return context;
};
