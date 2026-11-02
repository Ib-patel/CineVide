"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  loginUser,
  registerUser,
} from "@/server/auth/service";
import { createSessionForUser, destroyCurrentSession } from "@/server/auth/session";
import { loginSchema, registerSchema } from "@/server/validators";
import type { ActionState } from "@/app/auth/action-states";

export async function signInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const result = await loginUser(parsed.data);
    await destroyCurrentSession().catch(() => undefined);
    await createSessionForUser(result.user.id);

    revalidatePath("/", "layout");
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return { error: error.message };
    }
    return { error: "Sign in is temporarily unavailable. Please try again." };
  }
  redirect("/");
}

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const result = await registerUser(parsed.data);
    await createSessionForUser(result.user.id);
    revalidatePath("/", "layout");
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return { error: error.message };
    }
    return { error: "Sign up is temporarily unavailable. Please try again." };
  }
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await destroyCurrentSession();
  revalidatePath("/", "layout");
  redirect("/");
}
