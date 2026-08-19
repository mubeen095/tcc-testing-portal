export const env = {
  jwtSecret:
    process.env.JWT_SECRET ?? "dev-insecure-secret-change-me-in-production",
  sessionCookie: process.env.SESSION_COOKIE ?? "tcc_session",
  sessionTtlDays: parseInt(process.env.SESSION_TTL_DAYS ?? "7", 10),
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "The Coding Company",
  assessmentDurationMinutes: parseInt(
    process.env.ASSESSMENT_DURATION_MINUTES ?? "30",
    10
  ),
  blobToken: process.env.BLOB_READ_WRITE_TOKEN,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  databaseUrl: process.env.DATABASE_URL,
};

export const ASSESSMENT_DURATION_MINUTES = env.assessmentDurationMinutes;
export const TOTAL_QUESTIONS_PER_SECTION = 12;
export const MARKS_PER_QUESTION = 1;
export const TOTAL_MARKS = 36;

export const SECTION_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication & Grammar",
  APTITUDE: "Aptitude",
  VIBE: "Vibe Check",
};