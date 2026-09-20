"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/lib/store/services/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
      }).unwrap();

      if (result.needsLocationSelection) {
        router.push("/select-location");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const apiError = err as {
        data?: { error?: string; issues?: Array<{ message: string }> };
        error?: string;
      };

      if (apiError.data?.issues && apiError.data.issues.length > 0) {
        setErrorMessage(apiError.data.issues.map((i) => i.message).join(", "));
      } else if (apiError.data?.error) {
        setErrorMessage(apiError.data.error);
      } else if (apiError.error) {
        setErrorMessage(apiError.error);
      } else {
        setErrorMessage("An unexpected error occurred during login.");
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4">
      {/* card */}
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-4xl font-bold text-[#3d3560]">Login</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-[#e8e5f5] bg-white p-8 shadow-[0_8px_30px_rgba(107,93,211,0.12)]"
        >
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs text-[#8a83ab]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="example@example.com"
              className="w-full rounded-lg border border-[#e8e5f5] bg-[#faf9fd] px-4 py-3 text-sm text-[#3d3560] placeholder:text-[#a39dc4] focus:border-[#6b5dd3] focus:outline-none focus:ring-2 focus:ring-[#6b5dd3]/40 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs text-[#8a83ab]">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-[#e8e5f5] bg-[#faf9fd] px-4 py-3 text-sm text-[#3d3560] placeholder:text-[#a39dc4] focus:border-[#6b5dd3] focus:outline-none focus:ring-2 focus:ring-[#6b5dd3]/40 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#6b5dd3] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5b4dc4] disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-xs text-[#8a83ab] underline decoration-[#d8d3ee] underline-offset-2 hover:text-[#6b5dd3]"
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}