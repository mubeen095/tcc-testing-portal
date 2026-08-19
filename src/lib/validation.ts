import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number"),
    college: z.string().trim().min(2, "College name is required"),
    branch: z.string().trim().min(1, "Branch is required"),
    academicYear: z.string().trim().min(1, "Academic year is required"),
    rollNumber: z.string().trim().min(1, "Roll number is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const candidateCreateSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number"),
    college: z.string().trim().min(2, "College name is required"),
    branch: z.string().trim().min(1, "Branch is required"),
    academicYear: z.string().trim().min(1, "Academic year is required"),
    rollNumber: z.string().trim().min(1, "Roll number is required"),
    password: passwordSchema,
    testSetId: z.string().min(1, "Test set is required"),
  });

export const candidateUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).optional(),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional(),
    college: z.string().trim().min(2).optional(),
    branch: z.string().trim().min(1).optional(),
    academicYear: z.string().trim().min(1).optional(),
    rollNumber: z.string().trim().min(1).optional(),
    testSetId: z.string().min(1).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

export const questionSchema = z.object({
  testSetId: z.string().min(1),
  section: z.enum(["COMMUNICATION", "APTITUDE", "VIBE"]),
  number: z.number().int().min(1),
  text: z.string().trim().min(3, "Question text is required"),
  marks: z.number().int().min(1).max(5).default(1),
  isActive: z.boolean().default(true),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1),
        isCorrect: z.boolean().optional(),
      })
    )
    .min(2, "At least 2 options are required")
    .max(6, "At most 6 options are allowed"),
});

export const vibeAdjustSchema = z.object({
  score: z.number().int().min(0).max(12),
});

export const decisionSchema = z.object({
  decision: z.enum(["SELECTED", "REJECTED", "PENDING"]),
  adminNotes: z.string().max(5000).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const deleteConfirmSchema = z.object({
  confirmation: z.literal("DELETE"),
});

export const createAssessmentSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  durationMinutes: z.number().int().min(5).max(180).default(30),
});