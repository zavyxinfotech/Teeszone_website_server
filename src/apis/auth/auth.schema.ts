import { z } from "zod";
import { envelope } from "../../utils/zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

const userShape = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  role: z.string(),
  hasPassword: z.boolean(),
  googleLinked: z.boolean(),
});

const session = envelope(z.object({ token: z.string(), user: userShape }));

export const registerSchema = {
  description:
    "Create an account with email + password (email is the username). 409 if the email is already registered (with a password, or via Google).",
  tags: ["Auth"],
  summary: "Register",
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password,
  }),
  response: { 201: session },
};

export const loginSchema = {
  description: "Sign in with email + password. Returns a 7-day JWT.",
  tags: ["Auth"],
  summary: "Login",
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
  response: { 200: session },
};

export const googleSchema = {
  description:
    "Sign in with a Google ID token (GIS credential). Matches the account by verified email — Google and password sign-in share one account. 503 until GOOGLE_CLIENT_ID is configured.",
  tags: ["Auth"],
  summary: "Google sign-in",
  body: z.object({ credential: z.string().min(1) }),
  response: { 200: session },
};

export const forgotPasswordSchema = {
  description:
    "Email a 30-minute password-reset link. Always answers { sent: true } (no account enumeration); 45s cooldown per email (429). Also how Google-only accounts create their first password.",
  tags: ["Auth"],
  summary: "Forgot password",
  body: z.object({ email: z.string().email() }),
  response: { 200: envelope(z.object({ sent: z.boolean() })) },
};

export const resetPasswordSchema = {
  description: "Set a new password using the token from the reset email.",
  tags: ["Auth"],
  summary: "Reset password",
  body: z.object({ token: z.string().min(1), password }),
  response: { 200: envelope(z.object({ reset: z.boolean() })) },
};

export const meSchema = {
  description: "Current user's profile.",
  tags: ["Auth"],
  summary: "Me",
  security: [{ bearerAuth: [] }],
  response: { 200: envelope(userShape) },
};

export const updateMeSchema = {
  description: "Update the current user's name/phone.",
  tags: ["Auth"],
  summary: "Update profile",
  security: [{ bearerAuth: [] }],
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    phone: z.string().max(20).optional(),
  }),
  response: { 200: envelope(userShape) },
};

export const changePasswordSchema = {
  description:
    "Change the password (currentPassword required) — or create one for a Google-only account (currentPassword omitted).",
  tags: ["Auth"],
  summary: "Change / create password",
  security: [{ bearerAuth: [] }],
  body: z.object({
    currentPassword: z.string().optional(),
    newPassword: password,
  }),
  response: { 200: envelope(userShape) },
};
