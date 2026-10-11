import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

export const mobileLayoutQuery = '(max-width: 700px), (max-width: 1000px) and (max-height: 500px)';
export const ControlsContext = createContext({ mobile: false, host: null });

// Keep the scene and its simulation mounted while mobile settings open/close.
export function Controls({ children, ...props }) {
  const { mobile, host } = useContext(ControlsContext);
  const group = <div {...props}>{children}</div>;
  return mobile ? (host ? createPortal(group, host) : null) : group;
}
