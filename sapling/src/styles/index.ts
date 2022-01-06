export const colors = {
  text: '#ccc',

  focusOutline: '#88888844',

  controlPaletteBg: '#334',

  link: '#bbd',
  linkHover: '#ccf',

  buttonBg: 'linear-gradient(0deg, #223 0%, #445 100%)',
  buttonBorder: '#1c1c1c',

  controlBg: '#37374c',

  comboArrow: '#111',
  comboArrowBgHover: '#404058',
  comboBorder: '#1c1c1c',
  comboSliderBg: '#2d2d40',
  comboSliderKnob: '#3f3f53',
  comboSliderRange: '#5c5c6f',
  comboSliderRangeBorder: '#6c6c7f',
  comboLabel: '#aaa',
  comboText: '#ccc',
  comboTextEdit: '#eee',

  dialogBg: '#334',
  dialogBodyText: '#aaa',
  dialogBorder: '#000',
  dialogHeaderBg: '#223',
  dialogHeaderText: '#ccc',
  dialogShadow: '#0004',
  dialogSepLight: '#444',
  dialogSepDark: '#222',

  gradientSliderBorder: '#1c1c1c',

  textInputBg: '#223',
  textInputBorder: '#111',
  textInputColor: '#ccc',
  textInputSelectionColor: '#eee',
  textInputSelectionBg: '#9595d9',

  overlayColor: '#889',
};

export const fontFamilies = {
  default: `'Exo 2', sans-serif`,
  monospace: `'Ubuntu Mono', monospace`,
}

type ColorStop = [string, string | number];

export function linearGradient(direction: string, stops: ColorStop[]): string {
  const result = [direction];
  for (const stop of stops) {
    const [color, position] = stop;
    result.push(`${color} ${position}`);
  }
  return `linear-gradient(${result.join(',')})`;
}
