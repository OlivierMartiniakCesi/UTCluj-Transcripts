"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      // First, check if user already exists in our users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        return encodedRedirect(
          "error",
          "/sign-up",
          "An account with this email already exists. Please try signing in instead.",
        );
      }

      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        user_id: user.id,
        name: fullName,
        email: email,
        token_identifier: user.id,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error("Database insert error:", updateError);

        // Provide more specific error information
        let errorMessage = "Unable to complete account setup. ";

        if (updateError.code === "23505") {
          errorMessage +=
            "An account with this email already exists. Please try signing in instead.";
        } else if (updateError.code === "23502") {
          errorMessage +=
            "Required information is missing. Please fill in all fields and try again.";
        } else if (updateError.message?.includes("duplicate key")) {
          errorMessage += "This account already exists. Please try signing in.";
        } else if (updateError.code === "42P01") {
          errorMessage += "Database table not found. Please contact support.";
        } else if (updateError.code === "42703") {
          errorMessage += "Database column not found. Please contact support.";
        } else {
          errorMessage += `Database error (${updateError.code}): ${updateError.message}. Please contact support if this persists.`;
        }

        return encodedRedirect("error", "/sign-up", errorMessage);
      }
    } catch (err: any) {
      console.error("Unexpected error during account creation:", err);

      // Handle unexpected errors with more detail
      let errorMessage =
        "An unexpected error occurred during account creation. ";

      if (err?.message) {
        errorMessage += `Error details: ${err.message}. `;
      }

      errorMessage +=
        "Please try again or contact support if the issue persists.";

      return encodedRedirect("error", "/sign-up", errorMessage);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    // Pour le moment, on permet l'accès même sans abonnement
    // Vous pouvez changer cela selon vos besoins
    return true; // Permet l'accès gratuit
  }

  return !!subscription;
};
