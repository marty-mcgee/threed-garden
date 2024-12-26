import GridPaper from './GridPaper';

// (function checkWhenImported(): void {
//   // Check if the script is running on a browser environment
//   if (typeof window === 'undefined')
//     throw Error('Grid paper only works on a browser.\nPlease check out if your configuration is correct.');
//   // Check paper
//   if (typeof paper === 'undefined')
//     throw Error('paper.js is not detected.\nThis might happen due to a broken dependency');
// })();

(window as any).GridPaper = GridPaper;
export default GridPaper;
