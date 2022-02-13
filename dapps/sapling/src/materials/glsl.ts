/** TypeScript string template constructor that is recognized by VSCode, so that
    we can get proper GLSL syntax highlighting.

    At some point it would also be nice to do template interpolation, etc...
 */
export default (literals: TemplateStringsArray, ...exprs: string[]): string => {
  let result: string[] = [];
  literals.forEach((str, i) => {
    result.push(str);
    result.push(exprs[i] || '');
  });
  return result.join('').trimStart();
};
