const nativeWarn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  const text = args.map((item) => String(item)).join(' ');
  // R3F still constructs THREE.Clock. three.js r183+ warns on every Canvas mount.
  if (text.includes('Clock: This module has been deprecated')) return;
  nativeWarn(...args);
};
