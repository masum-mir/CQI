import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "@/context/AuthContext"; 
 
const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Load the GIS script once, shared across all button instances.
let gsiPromise = null;
function loadGsi() {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return gsiPromise;
}

export default function GoogleLoginButton({
  onSuccess,              // (user) => void
  text = "signin_with",   // 'signin_with' | 'signup_with' | 'continue_with'
  width = 288,
}) {
  const slotRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const { googleLogin } = useAuthContext();

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set - Google login disabled.");
      return;
    }

    let cancelled = false;

    loadGsi()
      .then((google) => {
        if (cancelled || !slotRef.current) return;

        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            if (!credential) return;
            setBusy(true);
            try {
              const user = await googleLogin(credential);
              onSuccess?.(user);
            } catch (err) {
              const msg =
                err?.response?.data?.message || err?.message || "Google sign-in failed";
              toast.error(msg);
            } finally {
              setBusy(false);
            }
          },
        });

        google.accounts.id.renderButton(slotRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          logo_alignment: "left",
          width,
        });
      })
      .catch(() => toast.error("Could not load Google sign-in"));

    return () => {
      cancelled = true;
    };
  }, [googleLogin, onSuccess, text, width]);

  if (!CLIENT_ID) return null; // hide cleanly when not configured

  return (
    <div className="relative inline-block">
      <div ref={slotRef} />
      {busy && (
        <div className="absolute inset-0 bg-white/60 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Signing in…</span>
        </div>
      )}
    </div>
  );
}
