declare module 'react-aria-live' {
  import { ReactNode } from 'react';

  export interface LiveAnnouncerProps {
    children: ReactNode;
  }

  export interface AnnouncerContextValue {
    announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  }

  export default function LiveAnnouncer(props: LiveAnnouncerProps): JSX.Element;

  export function useAnnouncer(): AnnouncerContextValue;
}