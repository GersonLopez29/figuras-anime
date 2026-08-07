export const CONDITION_OPTIONS = [
  { value: "nuevo", label: "Nueva", icon: "🆕" },
  { value: "open_box", label: "Open box — caja abierta solo para revisión", icon: "📦" },
  { value: "usado_excelente", label: "Usada — Excelente estado", icon: "♻️" },
  { value: "usado_bueno", label: "Usada — Buen estado", icon: "♻️" },
  { value: "usado_regular", label: "Usada — Estado regular", icon: "♻️" },
] as const;

export type ConditionValue = (typeof CONDITION_OPTIONS)[number]["value"];

export const USED_CONDITION_OPTIONS = CONDITION_OPTIONS.filter(
  (c) => c.value !== "nuevo" && c.value !== "open_box"
);

export function isValidCondition(value: string): value is ConditionValue {
  return CONDITION_OPTIONS.some((c) => c.value === value);
}

export function isNewCondition(condition: string) {
  return condition === "nuevo";
}

export function isOpenBoxCondition(condition: string) {
  return condition === "open_box";
}

export function getConditionLabel(condition: string) {
  return CONDITION_OPTIONS.find((c) => c.value === condition)?.label ?? condition;
}

export function getConditionIcon(condition: string) {
  return CONDITION_OPTIONS.find((c) => c.value === condition)?.icon ?? "🆕";
}
