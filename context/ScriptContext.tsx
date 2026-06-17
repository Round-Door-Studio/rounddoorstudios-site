'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Script } from '@/lib/types';

interface ScriptContextValue {
  script: Script;
  setScript: (s: Script) => void;
}

const ScriptContext = createContext<ScriptContextValue>({
  script: 'simp',
  setScript: () => {},
});

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [script, setScriptState] = useState<Script>('simp');

  useEffect(() => {
    // Hydrate from localStorage (inline script already set data-script)
    const saved = (localStorage.getItem('rds-script') ?? 'simp') as Script;
    setScriptState(saved);
  }, []);

  function setScript(s: Script) {
    setScriptState(s);
    localStorage.setItem('rds-script', s);
    document.documentElement.setAttribute('data-script', s);
  }

  return (
    <ScriptContext.Provider value={{ script, setScript }}>
      {children}
    </ScriptContext.Provider>
  );
}

export function useScript() {
  return useContext(ScriptContext);
}
