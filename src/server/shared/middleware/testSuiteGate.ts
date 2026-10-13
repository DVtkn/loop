/**
 * Единая проверка тестового доступа по секрету TEST_SUITE_SECRET.
 * Fail-closed: если переменная не задана, вне продакшена допускается только
 * легаси-значение "true"; в продакшене без секрета тестовые механизмы отключены.
 */
export function isTestSuiteAllowed(value: unknown): boolean {
  const secret = (process.env.TEST_SUITE_SECRET || "").trim();
  if (secret) return value === secret;
  return process.env.NODE_ENV !== "production" && value === "true";
}
