export type RegistrationEntry = { type: string; number: string };

export function parseRegistrationEntries(value: unknown): RegistrationEntry[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const result: RegistrationEntry[] = [];
  for (const entry of value) {
    if (!entry || typeof entry.type !== "string" || typeof entry.number !== "string" ||
        entry.type.length > 100 || entry.number.length > 200) return null;
    result.push({type: entry.type.trim(), number: entry.number.trim()});
  }
  return result;
}

export function registrationEntries(settings: {
  animal_registrations?: unknown; animal_business_type?: string; animal_registration_number?: string;
}): RegistrationEntry[] {
  if (settings.animal_registrations != null) return parseRegistrationEntries(settings.animal_registrations) ?? [];
  const type = settings.animal_business_type ?? "", number = settings.animal_registration_number ?? "";
  return type || number ? [{type, number}] : [];
}
