import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div
      className={`container-fluid mx-auto w-full max-w-full min-w-0 px-4 lg:px-5 ${className}`}
    >
      {children}
    </div>
  );
}
