'use client';

import { useRef, useEffect } from 'react';
import FocusTrapReact from 'focus-trap-react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  paused?: boolean;
  onDeactivate?: () => void;
  initialFocus?: string | false;
  fallbackFocus?: string;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
}

export function FocusTrap({
  children,
  active = true,
  paused = false,
  onDeactivate,
  initialFocus,
  fallbackFocus,
  escapeDeactivates = true,
  clickOutsideDeactivates = true,
}: FocusTrapProps) {
  const trapRef = useRef<any>(null);

  useEffect(() => {
    if (!active && trapRef.current && typeof trapRef.current.deactivate === 'function') {
      trapRef.current.deactivate();
    }
  }, [active]);

  return (
    <FocusTrapReact
      ref={trapRef}
      active={active}
      paused={paused}
      focusTrapOptions={{
        onDeactivate,
        initialFocus,
        fallbackFocus,
        escapeDeactivates,
        clickOutsideDeactivates,
        returnFocusOnDeactivate: true,
        allowOutsideClick: true,
      }}
    >
      {children}
    </FocusTrapReact>
  );
}