/// <reference types="react-scripts" />

declare module 'react' {
  import * as React from 'react';
  export = React;
}

declare module 'react/jsx-runtime' {
  export default any;
  export const jsx: any;
  export const jsxs: any;
}

declare module 'react-dom/client' {
  import { Root } from 'react-dom';
  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module 'web-vitals' {
  export const getCLS: (onPerfEntry: any) => void;
  export const getFID: (onPerfEntry: any) => void;
  export const getFCP: (onPerfEntry: any) => void;
  export const getLCP: (onPerfEntry: any) => void;
  export const getTTFB: (onPerfEntry: any) => void;
  export type ReportHandler = (metric: any) => void;
} 