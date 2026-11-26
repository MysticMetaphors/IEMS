// Source - https://stackoverflow.com/a/72795869
// Posted by Nivethan, modified by community. See post 'Timeline' for change history
// Retrieved 2026-09-27, License - CC BY-SA 4.0

// Make svg imports work with typescript

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.StatelessComponent<SvgProps>;
  export default content;
}

// CSS modules are only used by the web build
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
