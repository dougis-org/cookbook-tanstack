export function getUniqueCookbookName(prefix = "Test Cookbook") {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}`;
}
