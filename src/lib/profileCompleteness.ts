// Profile completeness scoring + reminders.
// Each "field" returns a label and whether it's filled. Score = filled / total.

export type CompletenessField = { key: string; label: string; filled: boolean; weight?: number };

export function computeProfileCompleteness(p: any, hasEducation: boolean, hasEmployment: boolean): {
  score: number; // 0-100
  filled: number;
  total: number;
  missing: CompletenessField[];
  fields: CompletenessField[];
} {
  const fields: CompletenessField[] = [
    { key: "avatar_url", label: "Profile photo (passport)", filled: !!p?.avatar_url },
    { key: "display_name", label: "Display name", filled: !!p?.display_name?.trim() },
    { key: "bio", label: "Short bio", filled: !!p?.bio?.trim() },
    { key: "phone", label: "Phone number", filled: !!p?.phone?.trim() },
    { key: "date_of_birth", label: "Date of birth", filled: !!p?.date_of_birth },
    { key: "graduation_year", label: "Graduation year", filled: !!p?.graduation_year },
    { key: "department", label: "Department", filled: !!p?.department },
    { key: "country", label: "Country", filled: !!p?.country },
    { key: "state", label: "State / Region", filled: !!p?.state },
    { key: "city", label: "City", filled: !!p?.city },
    { key: "current_address", label: "Current address", filled: !!p?.current_address?.trim() },
    { key: "certificate_url", label: "Certificate uploaded", filled: !!p?.certificate_url },
    { key: "education", label: "At least one education entry", filled: hasEducation },
    { key: "employment", label: "At least one employment entry", filled: hasEmployment },
    { key: "social", label: "A social link (LinkedIn / X / etc.)", filled: !!(p?.linkedin || p?.twitter || p?.github || p?.facebook || p?.instagram || p?.website) },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const total = fields.length;
  const score = Math.round((filled / total) * 100);
  const missing = fields.filter((f) => !f.filled);
  return { score, filled, total, missing, fields };
}

export function certStatusMeta(status: string | null | undefined): { label: string; tone: "muted" | "amber" | "green" | "red"; description: string } {
  switch (status) {
    case "verified": return { label: "Verified", tone: "green", description: "Your certificate has been reviewed and approved by an admin." };
    case "rejected": return { label: "Rejected", tone: "red", description: "Your certificate was rejected. Please re-upload a clearer copy." };
    case "pending":  return { label: "Pending review", tone: "amber", description: "Your certificate is awaiting admin review." };
    default:         return { label: "Not uploaded", tone: "muted", description: "Upload your certificate to get verified." };
  }
}
