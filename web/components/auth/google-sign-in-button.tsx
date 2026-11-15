
"use client";

import { useState } from "react";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export function GoogleSignInButton() {
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        setLoading(true);

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#D8E7EF] bg-white px-5 text-sm font-semibold text-[#17364E] transition-colors hover:bg-[#F1F8FC] disabled:opacity-60"
        >
            <span className="text-lg font-bold text-[#4285F4]">
                G
            </span>

            {loading
                ? "Connecting..."
                : "Continue with Google"}
        </button>
    );
}