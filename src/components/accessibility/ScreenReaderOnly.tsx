import { ReactNode } from 'react';

interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span' 
}: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}