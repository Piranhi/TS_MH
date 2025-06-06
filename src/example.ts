export function useUndeclared() {
  return foo + 1; // 'foo' is not defined to trigger a warning
}
