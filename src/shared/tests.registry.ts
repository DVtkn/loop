export interface TestDefinition {
  id: string;
  title: string;
  sphere: "trust" | "closeness" | "communication" | "values" | "intimacy" | "lifestyle";
  totalQuestions: number;
}

/**
 * Единый реестр всех тестов — источник правды (SSOT).
 * ID и количество вопросов ОБЯЗАНЫ совпадать с данными в src/data/questionBank.ts.
 * Любой сервис, UI-элемент или расчёт обязан ссылаться ИСКЛЮЧИТЕЛЬНО на этот реестр.
 */
export const TESTS_REGISTRY: Record<string, TestDefinition> = {
  "TEST-S1": {
    id: "TEST-S1",
    title: "Стили привязанности (ECR)",
    sphere: "trust",
    totalQuestions: 6,
  },
  "TEST-S2": {
    id: "TEST-S2",
    title: "Пять языков любви",
    sphere: "closeness",
    totalQuestions: 6,
  },
  "TEST-S3": {
    id: "TEST-S3",
    title: "Четыре всадника Готтмана",
    sphere: "communication",
    totalQuestions: 5,
  },
  "TEST-D2": {
    id: "TEST-D2",
    title: "Стили разрешения конфликтов",
    sphere: "communication",
    totalQuestions: 5,
  },
  "TEST-D1": {
    id: "TEST-D1",
    title: "Семейные сценарии и роли",
    sphere: "values",
    totalQuestions: 5,
  },
  "TEST-S4": {
    id: "TEST-S4",
    title: "Треугольник любви Стернберга",
    sphere: "intimacy",
    totalQuestions: 5,
  },
  "TEST-C1": {
    id: "TEST-C1",
    title: "Наш идеальный день",
    sphere: "lifestyle",
    totalQuestions: 4,
  },
  "TEST-PT": {
    id: "TEST-PT",
    title: "Профиль личности (Big Five)",
    sphere: "lifestyle",
    totalQuestions: 8,
  },
};

/** Маппинг testId -> sphere для быстрого доступа */
export function getSphereByTestId(testId: string): TestDefinition["sphere"] | undefined {
  return TESTS_REGISTRY[testId]?.sphere;
}

/**
 * Вспомогательный тип для удобного перебора в UI.
 */
export interface TestRegistryEntry {
  label: string;
  sphere: TestDefinition["sphere"];
  questionCount: TestDefinition["totalQuestions"];
}

/** Массив для перебора в компонентах (сортировка по сфере) */
export const TEST_REGISTRY_ENTRIES: TestRegistryEntry[] = [
  { label: "Стили привязанности (ECR)", sphere: "trust", questionCount: 6 },
  { label: "Пять языков любви", sphere: "closeness", questionCount: 6 },
  { label: "Четыре всадника Готтмана", sphere: "communication", questionCount: 5 },
  { label: "Стили разрешения конфликтов", sphere: "communication", questionCount: 5 },
  { label: "Семейные сценарии и роли", sphere: "values", questionCount: 5 },
  { label: "Треугольник любви Стернберга", sphere: "intimacy", questionCount: 5 },
  { label: "Наш идеальный день", sphere: "lifestyle", questionCount: 4 },
  { label: "Профиль личности (Big Five)", sphere: "lifestyle", questionCount: 8 },
];
