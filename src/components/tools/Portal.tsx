import React from 'react';
import ReactDOM from 'react-dom';

type PortalProps = {
  children: React.ReactNode;
};

export function Portal({ children }: PortalProps) {
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(children, document.body);
}
