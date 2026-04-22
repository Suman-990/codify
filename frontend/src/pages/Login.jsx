import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminCreateQuestion from "./AdminDashboard";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: "", otp: "", newPassword: "" });
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Invalid email or password");
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("user", JSON.stringify(data));
      if (data.role === "ADMIN") navigate("/admindashboard");
      else navigate("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async () => {
    if (!forgotForm.email) {
      setForgotError("Enter your email first.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch(
        `/api/auth/send-otp?email=${encodeURIComponent(forgotForm.email)}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const msg = await res.text();
        setForgotError(msg || "Failed to send OTP.");
        return;
      }
      setForgotOtpSent(true);
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotForm.email,
          otp: forgotForm.otp,
          newPassword: forgotForm.newPassword,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setForgotError(msg || "Password update failed.");
        return;
      }

      // Success
      setIsForgotPassword(false);
      setForgotForm({ email: "", otp: "", newPassword: "" });
      setForgotOtpSent(false);
      setError("Password updated successfully. Please login.");
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div className="dark min-h-screen bg-[#131313] text-[#e2e2e2] font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="bg-[#131313] text-white flex justify-between items-center w-full px-8 py-4 z-50">
        <div className="text-xl font-bold tracking-tighter text-white font-['Space_Grotesk']">
          Codify
        </div>
      </header>

      {/* Main */}
      <main
        className="flex-grow flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, #353535 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#131313] via-transparent to-[#131313] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[440px] px-6 py-20 flex flex-col items-center">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="font-['Space_Grotesk'] text-4xl font-bold tracking-tighter mb-4 text-white">
              Codify
            </h1>
            <p className="font-['Inter'] text-[#c6c6c6] text-sm max-w-[280px] mx-auto leading-relaxed">
              A high-fidelity coding environment for the modern engineer.
            </p>
          </div>

          <div className="w-full space-y-8">
            {!isForgotPassword ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="group">
                    <label className="font-['Inter'] text-[10px] uppercase tracking-widest text-[#c6c6c6] mb-1.5 block px-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="engineer@monolith.io"
                      className="w-full bg-[#1b1b1b] border-b-2 border-transparent border-b-[#474747]/30 text-[#e2e2e2] px-4 py-3 focus:outline-none focus:border-b-white transition-all duration-200 placeholder:text-[#353535] font-['Inter'] text-sm"
                    />
                  </div>
                  <div className="group">
                    <label className="font-['Inter'] text-[10px] uppercase tracking-widest text-[#c6c6c6] mb-1.5 block px-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#1b1b1b] border-b-2 border-transparent border-b-[#474747]/30 text-[#e2e2e2] px-4 py-3 focus:outline-none focus:border-b-white transition-all duration-200 placeholder:text-[#353535] font-['Inter'] text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[#ffb4ab] text-xs text-center tracking-wide">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-['Space_Grotesk'] font-bold py-4 tracking-tighter hover:brightness-90 transition-all duration-100 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(180deg, #ffffff 0%, #d4d4d4 100%)",
                    color: "#000000",
                  }}
                >
                  {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
                </button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleUpdatePassword}>
                <div className="space-y-4">
                  <div className="group">
                    <label className="font-['Inter'] text-[10px] uppercase tracking-widest text-[#c6c6c6] mb-1.5 block px-1">
                      System Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                        required
                        placeholder="engineer@monolith.io"
                        className="w-full bg-[#1b1b1b] border-b-2 border-transparent border-b-[#474747]/30 text-[#e2e2e2] px-4 py-3 focus:outline-none focus:border-b-white transition-all duration-200 placeholder:text-[#353535] font-['Inter'] text-sm"
                        disabled={forgotOtpSent}
                      />
                      <button
                        type="button"
                        onClick={handleForgotSendOtp}
                        disabled={forgotLoading || forgotOtpSent}
                        className="px-4 py-3 bg-[#2a2a2a] text-[#e2e2e2] font-['Space_Grotesk'] text-[10px] font-bold tracking-tighter uppercase whitespace-nowrap hover:bg-[#393939] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#474747]/10"
                      >
                        {forgotLoading && !forgotOtpSent ? "SENDING..." : forgotOtpSent ? "OTP SENT ✓" : "SEND OTP"}
                      </button>
                    </div>
                  </div>

                  {forgotOtpSent && (
                    <>
                      <div className="group">
                        <label className="font-['Inter'] text-[10px] uppercase tracking-widest text-[#c6c6c6] mb-1.5 block px-1">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          value={forgotForm.otp}
                          onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value })}
                          required
                          maxLength={6}
                          placeholder="XXXXXX"
                          className="w-full bg-[#1b1b1b] border-b-2 border-transparent border-b-[#474747]/30 text-[#e2e2e2] px-4 py-3 focus:outline-none focus:border-b-white transition-all duration-200 placeholder:text-[#353535] font-['Inter'] text-sm tracking-[0.5em] text-center"
                        />
                      </div>
                      <div className="group">
                        <label className="font-['Inter'] text-[10px] uppercase tracking-widest text-[#c6c6c6] mb-1.5 block px-1">
                          New Secure Password
                        </label>
                        <input
                          type="password"
                          value={forgotForm.newPassword}
                          onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                          required
                          placeholder="••••••••••••"
                          className="w-full bg-[#1b1b1b] border-b-2 border-transparent border-b-[#474747]/30 text-[#e2e2e2] px-4 py-3 focus:outline-none focus:border-b-white transition-all duration-200 placeholder:text-[#353535] font-['Inter'] text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>

                {forgotError && (
                  <p className="text-[#ffb4ab] text-xs text-center tracking-wide">
                    {forgotError}
                  </p>
                )}

                {forgotOtpSent && (
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full font-['Space_Grotesk'] font-bold py-4 tracking-tighter hover:brightness-90 transition-all duration-100 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(180deg, #ffffff 0%, #d4d4d4 100%)",
                      color: "#000000",
                    }}
                  >
                    {forgotLoading ? "UPDATING PROTOCOL..." : "UPDATE SYSTEM ACCESS"}
                  </button>
                )}
              </form>
            )}

            {/* Divider */}
            {!isForgotPassword && (
              <div className="relative flex items-center py-2">
                <div className="flex-grow h-[1px] bg-[#474747]/20" />
                <span className="flex-shrink mx-4 font-['Inter'] text-[10px] text-[#353535] uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-grow h-[1px] bg-[#474747]/20" />
              </div>
            )}

            {/* Google */}
            {!isForgotPassword && (
              <button className="w-full bg-[#2a2a2a] text-[#e2e2e2] font-['Inter'] text-sm py-4 flex items-center justify-center gap-3 border border-[#474747]/10 hover:bg-[#393939] transition-colors duration-100 active:bg-[#353535]"
                onClick={() => {
                  window.location.href = "http://localhost:8080/oauth2/authorization/google";
                }
                }
              >
                <img
                  src="/google-logo-2025-6ffb.png"
                  alt="Google Logo"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>
            )}

            {/* Links */}
            <div className="flex flex-col gap-4 items-center pt-4">
              {!isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError("");
                  }}
                  className="font-['Inter'] text-[10px] text-[#c6c6c6] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotError("");
                  }}
                  className="font-['Inter'] text-[10px] text-[#c6c6c6] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Return to System Login
                </button>
              )}
              <div className="h-[1px] w-8 bg-[#474747]/30" />
              <p className="font-['Inter'] text-[10px] text-[#353535] uppercase tracking-widest">
                New here?{" "}
                <Link
                  to="/register"
                  className="text-white hover:underline underline-offset-4"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 flex justify-between items-center text-[#c6c6c6] border-t border-transparent">
        <div className="font-['Inter'] text-[10px] uppercase tracking-widest opacity-50">
          © 2024 Codify
        </div>
      </footer>
    </div>
  );
}