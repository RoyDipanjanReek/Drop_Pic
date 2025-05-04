"use client";

import { useForm } from "react-hook-form";
import { useSignUp } from "@clerk/nextjs";
import { z } from "zod";

// zod custom schema
import { signUpSchema } from "@/schemas/signUpSchema";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const { signUp, isLoaded, setActive } = useSignUp();
  const [verificationCode, setVerificationCode] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!isLoaded) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setVerifying(true);
    } catch (error: any) {
      console.log("signup error");
      setAuthError(
        error.errors?.[0]?.message ||
          "An error occured during the sign up. Please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!isLoaded || !signUp) return;
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        console.error("Verification incomplete", result);
        setVerificationError("Verification could not be complete");
      }
    } catch (error: any) {
      console.error("Verification incomplete", error);
      setVerificationError(
        error.errors?.[0]?.message ||
          "An error occured during the sign up. Please try again"
      );
    } finally {
      setIsSubmitting(false)
    }
  };

  if (verifying) {
    return <h1>this is OTP entering field</h1>;
  }

  return <h1>sign up form</h1>;
}
