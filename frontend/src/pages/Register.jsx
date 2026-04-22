import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// Profile picture options — files should live in src/assets/pfp/
// Integer IDs map to filenames: 1.png, 2.png, ... etc.
const PFP_OPTIONS = [
  // Series Alpha [M-Type]
  { id: 1, icon: "person", label: "Alpha-01" },
  { id: 2, icon: "person_4", label: "Alpha-02" },
  { id: 3, icon: "face", label: "Alpha-03" },
  { id: 4, icon: "robot_2", label: "Alpha-04" },
  { id: 5, icon: "smart_toy", label: "Alpha-05" },
  // Series Beta [F-Type]
  { id: 6, icon: "person_2", label: "Beta-01" },
  { id: 7, icon: "person_3", label: "Beta-02" },
  { id: 8, icon: "support_agent", label: "Beta-03" },
  { id: 9, icon: "neurology", label: "Beta-04" },
  { id: 10, icon: "account_circle", label: "Beta-05" },
];

const COUNTRIES = [
  "UNITED STATES [US]",
  "UNITED KINGDOM [UK]",
  "GERMANY [DE]",
  "JAPAN [JP]",
  "INDIA [IN]",
  "CANADA [CA]",
  "AUSTRALIA [AU]",
  "FRANCE [FR]",
  "BRAZIL [BR]",
  "GLOBAL MESH",
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    username: "",
    otp: "",
    password: "",
    country: COUNTRIES[0],
    profilePictureId: 2, // default selection
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");

  const selectedPfp = PFP_OPTIONS.find((p) => p.id === form.profilePictureId);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSendOtp = async () => {
    if (!form.email) {
      setOtpError("Enter your email first.");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch(
        `/api/auth/send-otp?email=${encodeURIComponent(form.email)}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const msg = await res.text();
        setOtpError(msg || "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          password: form.password,
          otp: form.otp,
          country: form.country,
          profilePictureId: form.profilePictureId,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Registration failed.");
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-['Inter'] flex flex-col">
      {/* Header */}
      <header className="flex items-center h-16 px-8 w-full justify-start bg-[#131313] fixed top-0 z-50">
        <div className="text-2xl font-bold tracking-tighter text-white font-['Space_Grotesk'] uppercase">
          Codify
        </div>
      </header>

      {/* Main */}
      <main
        className="min-h-screen pt-16 pb-24 flex flex-col items-center justify-center px-6"
        style={{
          backgroundImage:
            "radial-gradient(circle, #353535 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-12 items-start mt-12 mb-20">

          {/* ── Form Side ── */}
          <div className="md:col-span-7 bg-[#1f1f1f] p-10">
            <div className="mb-10">
              <h1 className="font-['Space_Grotesk'] text-4xl font-bold tracking-tighter uppercase mb-2 text-white">
                Initialize Account
              </h1>
              <p className="text-[#c6c6c6] font-['Inter'] tracking-wide text-xs uppercase opacity-70">
                Step 01: System Verification
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Email + OTP button */}
              <div className="group">
                <label className="block font-['Inter'] text-[10px] tracking-widest uppercase mb-2 text-[#c6c6c6]">
                  Email Address
                </label>
                <div className="flex items-center bg-[#0e0e0e] border-b-2 border-[#474747] focus-within:border-white transition-colors">
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    required
                    placeholder="USER@MONOLITH.SYSTEM"
                    className="w-full bg-transparent border-none p-4 font-['Inter'] text-sm tracking-widest placeholder:text-[#353535] focus:outline-none text-[#e2e2e2]"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || otpSent}
                    className="px-5 py-2 bg-white text-black font-['Space_Grotesk'] text-[10px] font-bold tracking-tighter uppercase mr-2 hover:bg-[#d4d4d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {otpLoading ? "SENDING..." : otpSent ? "OTP SENT ✓" : "Send OTP"}
                  </button>
                </div>
                {otpError && (
                  <p className="text-[#ffb4ab] text-[10px] mt-1 tracking-wide">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="group">
                <label className="block font-['Inter'] text-[10px] tracking-widest uppercase mb-2 text-[#c6c6c6]">
                  Username
                </label>
                <div className="bg-[#0e0e0e] border-b-2 border-[#474747] focus-within:border-white transition-colors">
                  <input
                    type="text"
                    value={form.username}
                    onChange={handleChange("username")}
                    required
                    placeholder="USER_NAME"
                    className="w-full bg-transparent border-none p-4 font-['Inter'] text-sm tracking-widest placeholder:text-[#353535] focus:outline-none text-[#e2e2e2]"
                  />
                </div>
              </div>

              {/* OTP */}
              <div>
                <label className="block font-['Inter'] text-[10px] tracking-widest uppercase mb-2 text-[#c6c6c6]">
                  Verification Code
                </label>
                <div className="bg-[#0e0e0e] border-b-2 border-[#474747] focus-within:border-white transition-colors">
                  <input
                    type="text"
                    value={form.otp}
                    onChange={handleChange("otp")}
                    required
                    maxLength={6}
                    placeholder="XXXXXX"
                    className="w-full bg-transparent border-none p-4 font-['Inter'] text-sm text-center placeholder:text-[#353535] focus:outline-none text-[#e2e2e2]"
                    style={{ letterSpacing: "1rem" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-['Inter'] text-[10px] tracking-widest uppercase mb-2 text-[#c6c6c6]">
                  Secure Password
                </label>
                <div className="bg-[#0e0e0e] border-b-2 border-[#474747] focus-within:border-white transition-colors">
                  <input
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none p-4 font-['Inter'] text-sm tracking-widest placeholder:text-[#353535] focus:outline-none text-[#e2e2e2]"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block font-['Inter'] text-[10px] tracking-widest uppercase mb-2 text-[#c6c6c6]">
                  Geographic Node
                </label>
                <div className="relative bg-[#0e0e0e] border-b-2 border-[#474747] focus-within:border-white transition-colors">
                  <select
                    value={form.country}
                    onChange={handleChange("country")}
                    className="w-full bg-transparent border-none p-4 font-['Inter'] text-sm tracking-widest appearance-none text-[#e2e2e2] focus:outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-[#131313] text-[#e2e2e2]">
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#c6c6c6]">
                    expand_more
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-[#ffb4ab] text-xs tracking-wide text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-white text-black py-5 font-['Space_Grotesk'] text-lg font-extrabold tracking-tighter uppercase hover:bg-[#d4d4d4] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitLoading ? "INITIALIZING..." : "Create Account"}
                {!submitLoading && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    arrow_forward
                  </span>
                )}
              </button>

              <p className="font-['Inter'] text-[10px] text-[#353535] uppercase tracking-widest text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-white hover:underline underline-offset-4">
                  Sign In
                </Link>
              </p>
            </form>
          </div>

          {/* ── Profile Picture Side ── */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-[#0e0e0e] p-8">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold tracking-tighter uppercase mb-6 border-l-4 border-white pl-4">
                Identity Protocol
              </h3>
              <p className="font-['Inter'] text-[10px] tracking-widest uppercase mb-6 text-[#c6c6c6] leading-relaxed">
                Select one geometric avatar for your global system identification.
              </p>

              {/* Series Alpha */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-5 font-['Inter'] text-[9px] tracking-widest uppercase text-[#353535] mb-1 mt-2">
                  Series Alpha [M-Type]
                </div>
                {PFP_OPTIONS.slice(0, 5).map((pfp) => (
                  <PfpButton
                    key={pfp.id}
                    pfp={pfp}
                    selected={form.profilePictureId === pfp.id}
                    onSelect={() =>
                      setForm((prev) => ({ ...prev, profilePictureId: pfp.id }))
                    }
                  />
                ))}

                {/* Series Beta */}
                <div className="col-span-5 font-['Inter'] text-[9px] tracking-widest uppercase text-[#353535] mb-1 mt-4">
                  Series Beta [F-Type]
                </div>
                {PFP_OPTIONS.slice(5).map((pfp) => (
                  <PfpButton
                    key={pfp.id}
                    pfp={pfp}
                    selected={form.profilePictureId === pfp.id}
                    onSelect={() =>
                      setForm((prev) => ({ ...prev, profilePictureId: pfp.id }))
                    }
                  />
                ))}
              </div>

              {/* Selected Preview */}
              <div className="mt-8 pt-8 border-t border-[#353535]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-black text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {selectedPfp?.icon}
                    </span>
                  </div>
                  <div>
                    <div className="font-['Space_Grotesk'] text-xs font-bold tracking-tighter uppercase">
                      Selected: {selectedPfp?.label}
                    </div>
                    <div className="font-['Inter'] text-[9px] text-[#353535] tracking-widest uppercase">
                      ID: pfp_{String(form.profilePictureId).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#2a2a2a] p-6 text-[#c6c6c6] font-['Inter'] text-[10px] leading-relaxed tracking-wider">
              <p>
                BY CLICKING CREATE ACCOUNT, YOU AGREE TO OUR TERMS OF PROTOCOL
                AND DATA RETENTION POLICIES. SYSTEM USAGE IS MONITORED FOR
                QUALITY AND OPTIMIZATION.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full flex justify-between items-center px-8 py-4 bg-[#0e0e0e] z-50">
        <div className="text-white font-['Inter'] text-[10px] tracking-widest uppercase">
          © 2024 MONOLITH. SYSTEM_READY
        </div>
        <div className="flex gap-8">
          {["TERMS", "PRIVACY", "DOCS"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[#474747] font-['Inter'] text-[10px] tracking-widest uppercase hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

// ── Sub-component: individual pfp button ──
function PfpButton({ pfp, selected, onSelect }) {
  // Try to load from assets; fall back to Material Symbol icon
  // Place actual images at: src/assets/pfp/1.png, 2.png, etc.
  const imgSrc = `/src/assets/pfp/${pfp.id}.png`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`aspect-square bg-[#1f1f1f] flex items-center justify-center group border transition-colors ${selected
          ? "border-white"
          : "border-transparent hover:border-white/40"
        }`}
      title={pfp.label}
    >
      <PfpImage src={imgSrc} fallbackIcon={pfp.icon} selected={selected} />
    </button>
  );
}

// Tries <img>; if it 404s falls back to Material Symbol
function PfpImage({ src, fallbackIcon, selected }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="w-8 h-8 object-cover group-hover:scale-110 transition-transform"
      />
    );
  }

  return (
    <span
      className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform"
      style={
        selected ? { fontVariationSettings: "'FILL' 1" } : {}
      }
    >
      {fallbackIcon}
    </span>
  );
}