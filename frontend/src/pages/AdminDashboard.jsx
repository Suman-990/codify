import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const LANGUAGES = ["java", "python", "cpp"];
const LANG_LABELS = { java: "Java", python: "Python", cpp: "C++" };
const LANG_PLACEHOLDER = {
  java: `public class Solution {\n    public int solve(int[] nums) {\n        // your code here\n        return 0;\n    }\n}`,
  python: `class Solution:\n    def solve(self, nums: List[int]) -> int:\n        # your code here\n        return 0`,
  cpp: `class Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // your code here\n        return 0;\n    }\n};`,
};

const STEPS = [
  { id: 1, label: "METADATA", icon: "info" },
  { id: 2, label: "DESCRIPTION", icon: "article" },
  { id: 3, label: "STUBS", icon: "code" },
  { id: 4, label: "SOLUTIONS", icon: "psychology" },
  { id: 5, label: "REVIEW", icon: "checklist" },
];

const EMPTY_FORM = {
  title: "",
  difficulty: "EASY",
  tags: [],
  constraints: [],
  description: "",
  exampleInput: "",
  exampleOutput: "",
  main_java: "",
  main_python: "",
  main_cpp: "",
  solution_java: "",
  solution_python: "",
  solution_cpp: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function DifficultyBadge({ value }) {
  const colors = {
    EASY: "text-[#6ee7b7] border-[#6ee7b7]/30 bg-[#6ee7b7]/5",
    MEDIUM: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/5",
    HARD: "text-[#f87171] border-[#f87171]/30 bg-[#f87171]/5",
  };
  return (
    <span className={`font-['Inter'] text-[10px] tracking-widest uppercase px-2 py-0.5 border ${colors[value] ?? ""}`}>
      {value}
    </span>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-grow bg-[#2a2a2a]" />
      <span className="font-['Inter'] text-[9px] tracking-[0.25em] text-[#474747] uppercase">
        {children}
      </span>
      <div className="h-px flex-grow bg-[#2a2a2a]" />
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#919191]">
          {label}
        </label>
        {hint && (
          <span className="font-['Inter'] text-[9px] text-[#474747]">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-[#0e0e0e] border border-[#2a2a2a] focus:border-[#919191] text-[#e2e2e2] px-4 py-3 font-['JetBrains_Mono'] text-sm placeholder:text-[#2a2a2a] focus:outline-none transition-colors ${className}`}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-[#0e0e0e] border border-[#2a2a2a] focus:border-[#919191] text-[#e2e2e2] px-4 py-3 font-['JetBrains_Mono'] text-sm placeholder:text-[#2a2a2a] focus:outline-none transition-colors resize-none"
    />
  );
}

function CodeEditor({ label, lang, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#919191]">
          {label}
        </label>
        <span className="font-['Inter'] text-[9px] text-[#474747] uppercase">{lang}</span>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col items-center pt-3 pointer-events-none select-none">
          {Array.from({ length: Math.max(value.split("\n").length, 10) }, (_, i) => (
            <div key={i} className="font-['Inter'] text-[9px] text-[#2a2a2a] leading-[1.6rem]">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={LANG_PLACEHOLDER[lang]}
          rows={Math.max(value.split("\n").length + 1, 10)}
          spellCheck={false}
          className="w-full bg-[#0e0e0e] border border-[#2a2a2a] focus:border-[#474747] text-[#c6c6c6] pl-14 pr-4 py-3 font-['JetBrains_Mono'] text-sm placeholder:text-[#1f1f1f] focus:outline-none transition-colors resize-none leading-[1.6rem]"
        />
      </div>
    </div>
  );
}

function TagInput({ label, items, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (val && !items.includes(val)) {
      onAdd(val);
      setInput("");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !input && items.length) onRemove(items[items.length - 1]);
  };

  return (
    <Field label={label}>
      <div className="bg-[#0e0e0e] border border-[#2a2a2a] focus-within:border-[#919191] transition-colors p-3 min-h-[52px] flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 bg-[#1f1f1f] border border-[#2a2a2a] font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#c6c6c6] px-2 py-1"
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="text-[#474747] hover:text-[#e2e2e2] transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={items.length === 0 ? placeholder : ""}
          className="bg-transparent font-['Inter'] text-sm text-[#e2e2e2] placeholder:text-[#2a2a2a] focus:outline-none flex-1 min-w-[120px]"
        />
        {input && (
          <button
            type="button"
            onClick={add}
            className="font-['Inter'] text-[9px] uppercase tracking-widest text-[#919191] hover:text-white px-2 border border-[#474747] hover:border-white transition-colors"
          >
            Add
          </button>
        )}
      </div>
      <p className="font-['Inter'] text-[9px] text-[#474747]">Press Enter to add</p>
    </Field>
  );
}

// ── Step Components ────────────────────────────────────────────────────────────
function StepMetadata({ form, update }) {
  return (
    <div className="space-y-8">
      <SectionLabel>Question Identity</SectionLabel>

      <Field label="Title" hint="required">
        <TextInput
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Two Sum"
        />
      </Field>

      <Field label="Difficulty" hint="required">
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => update("difficulty", d)}
              className={`flex-1 py-3 font-['Inter'] text-[10px] tracking-widest uppercase border transition-all ${form.difficulty === d
                  ? d === "EASY"
                    ? "border-[#6ee7b7] text-[#6ee7b7] bg-[#6ee7b7]/5"
                    : d === "MEDIUM"
                      ? "border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/5"
                      : "border-[#f87171] text-[#f87171] bg-[#f87171]/5"
                  : "border-[#2a2a2a] text-[#474747] hover:border-[#474747]"
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>

      <TagInput
        label="Tags"
        items={form.tags}
        onAdd={(v) => update("tags", [...form.tags, v])}
        onRemove={(v) => update("tags", form.tags.filter((t) => t !== v))}
        placeholder="array, two-pointers, hash-map..."
      />

      <TagInput
        label="Constraints"
        items={form.constraints}
        onAdd={(v) => update("constraints", [...form.constraints, v])}
        onRemove={(v) => update("constraints", form.constraints.filter((c) => c !== v))}
        placeholder="1 ≤ n ≤ 10^5"
      />
    </div>
  );
}

function StepDescription({ form, update }) {
  return (
    <div className="space-y-8">
      <SectionLabel>Problem Statement</SectionLabel>

      <Field label="Description" hint="Markdown supported">
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder={"Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution..."}
          rows={10}
        />
      </Field>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Example Input">
          <Textarea
            value={form.exampleInput}
            onChange={(e) => update("exampleInput", e.target.value)}
            placeholder={"nums = [2,7,11,15]\ntarget = 9"}
            rows={5}
          />
        </Field>
        <Field label="Example Output">
          <Textarea
            value={form.exampleOutput}
            onChange={(e) => update("exampleOutput", e.target.value)}
            placeholder={"[0,1]\nExplanation: nums[0] + nums[1] == 9"}
            rows={5}
          />
        </Field>
      </div>
    </div>
  );
}

function StepCodeSection({ form, update, prefix, heading, subtext }) {
  const [activeLang, setActiveLang] = useState("java");
  return (
    <div className="space-y-6">
      <SectionLabel>{heading}</SectionLabel>
      <p className="font-['Inter'] text-[11px] text-[#474747] -mt-2">{subtext}</p>

      {/* Language tabs */}
      <div className="flex border-b border-[#1f1f1f]">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`px-6 py-3 font-['Inter'] text-[10px] tracking-widest uppercase transition-all border-b-2 -mb-px ${activeLang === lang
                ? "border-white text-white"
                : "border-transparent text-[#474747] hover:text-[#919191]"
              }`}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}
        <div className="flex-grow" />
        <div className="flex items-center pr-4">
          {LANGUAGES.map((lang) => (
            <div
              key={lang}
              className={`w-1.5 h-1.5 rounded-full mx-1 transition-colors ${form[`${prefix}_${lang}`]?.trim()
                  ? "bg-[#6ee7b7]"
                  : "bg-[#2a2a2a]"
                }`}
              title={`${LANG_LABELS[lang]}: ${form[`${prefix}_${lang}`]?.trim() ? "filled" : "empty"}`}
            />
          ))}
        </div>
      </div>

      <CodeEditor
        label={`${LANG_LABELS[activeLang]} ${heading.toLowerCase()}`}
        lang={activeLang}
        value={form[`${prefix}_${activeLang}`]}
        onChange={(e) => update(`${prefix}_${activeLang}`, e.target.value)}
      />
    </div>
  );
}

function StepReview({ form }) {
  const fieldRow = (label, value) => (
    <div key={label} className="flex gap-4 py-3 border-b border-[#1f1f1f]">
      <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] w-32 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="font-['Inter'] text-sm text-[#e2e2e2] break-all">
        {value || <span className="text-[#2a2a2a]">—</span>}
      </span>
    </div>
  );

  const codeStatus = (prefix) =>
    LANGUAGES.map((l) => (
      <span
        key={l}
        className={`font-['Inter'] text-[9px] uppercase px-2 py-0.5 border mr-1 ${form[`${prefix}_${l}`]?.trim()
            ? "border-[#6ee7b7]/30 text-[#6ee7b7]"
            : "border-[#2a2a2a] text-[#474747]"
          }`}
      >
        {LANG_LABELS[l]}
      </span>
    ));

  return (
    <div className="space-y-8">
      <SectionLabel>Review & Submit</SectionLabel>

      <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-6 space-y-1">
        {fieldRow("Title", form.title)}
        <div className="flex gap-4 py-3 border-b border-[#1f1f1f]">
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] w-32 flex-shrink-0 pt-0.5">
            Difficulty
          </span>
          <DifficultyBadge value={form.difficulty} />
        </div>
        <div className="flex gap-4 py-3 border-b border-[#1f1f1f]">
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] w-32 flex-shrink-0 pt-0.5">
            Tags
          </span>
          <div className="flex flex-wrap gap-1">
            {form.tags.length
              ? form.tags.map((t) => (
                <span key={t} className="font-['Inter'] text-[9px] uppercase tracking-widest text-[#c6c6c6] border border-[#2a2a2a] px-2 py-0.5">
                  {t}
                </span>
              ))
              : <span className="text-[#2a2a2a] font-['Inter'] text-sm">—</span>}
          </div>
        </div>
        <div className="flex gap-4 py-3 border-b border-[#1f1f1f]">
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] w-32 flex-shrink-0 pt-0.5">
            Constraints
          </span>
          <div className="space-y-1">
            {form.constraints.length
              ? form.constraints.map((c) => (
                <div key={c} className="font-['Inter'] text-sm text-[#e2e2e2]">• {c}</div>
              ))
              : <span className="text-[#2a2a2a] font-['Inter'] text-sm">—</span>}
          </div>
        </div>
        {fieldRow("Description", form.description?.slice(0, 120) + (form.description?.length > 120 ? "..." : ""))}
        {fieldRow("Example Input", form.exampleInput)}
        {fieldRow("Example Output", form.exampleOutput)}
        <div className="flex gap-4 py-3 border-b border-[#1f1f1f]">
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] w-32 flex-shrink-0 pt-0.5">
            Stubs
          </span>
          <div>{codeStatus("main")}</div>
        </div>
        <div className="flex gap-4 py-3">
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] w-32 flex-shrink-0 pt-0.5">
            Solutions
          </span>
          <div>{codeStatus("solution")}</div>
        </div>
      </div>

      <div className="bg-[#6ee7b7]/5 border border-[#6ee7b7]/20 p-4 font-['JetBrains_Mono'] text-[10px] text-[#6ee7b7] tracking-wide">
        SYSTEM READY — Click "DEPLOY QUESTION" to publish this problem to the platform.
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminCreateQuestion() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 1) return form.title.trim();
    if (step === 2) return form.description.trim() && form.exampleInput.trim() && form.exampleOutput.trim();
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Failed to create question.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div className="w-20 h-20 border-2 border-[#6ee7b7] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[#6ee7b7] text-4xl">check</span>
          </div>
          <div>
            <h2 className="font-['JetBrains_Mono'] text-2xl text-white tracking-tight mb-2">
              DEPLOYED
            </h2>
            <p className="font-['JetBrains_Mono'] text-[11px] text-[#474747] tracking-widest uppercase">
              "{form.title}" is now live on the platform
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setForm(EMPTY_FORM); setStep(1); setSuccess(false); }}
              className="px-8 py-3 border border-[#2a2a2a] text-[#919191] font-['JetBrains_Mono'] text-[10px] tracking-widest uppercase hover:border-white hover:text-white transition-colors"
            >
              New Question
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="px-8 py-3 bg-white text-black font-['JetBrains_Mono'] text-[10px] tracking-widest uppercase hover:bg-[#d4d4d4] transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e2e2e2]">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-8 h-14">
        <div className="flex items-center gap-6">
          <span className="font-['Inter'] text-sm font-bold tracking-tighter text-white">
            Codify
          </span>
          <div className="h-4 w-px bg-[#2a2a2a]" />
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747]">
            Admin Console
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-[#6ee7b7] rounded-full animate-pulse" />
          <span className="font-['Inter'] text-[9px] tracking-widest uppercase text-[#6ee7b7]">
            ADMIN
          </span>
        </div>
      </header>

      <div className="flex pt-14 min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 fixed top-14 bottom-0 left-0 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col">
          <div className="p-6 border-b border-[#1f1f1f]">
            <p className="font-['Inter'] text-[9px] tracking-widest uppercase text-[#474747] mb-1">
              Operation
            </p>
            <h1 className="font-['Inter'] text-base font-bold tracking-tighter text-white">
              CREATE QUESTION
            </h1>
          </div>

          {/* Steps nav */}
          <nav className="flex-1 p-4 space-y-1">
            {STEPS.map((s) => {
              const isCompleted = s.id < step;
              const isCurrent = s.id === step;
              const isLocked = s.id > step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => !isLocked && setStep(s.id)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all group ${isCurrent
                      ? "bg-[#1f1f1f] border-l-2 border-white"
                      : isCompleted
                        ? "border-l-2 border-[#6ee7b7]/40 hover:bg-[#0e0e0e]"
                        : "border-l-2 border-transparent opacity-30 cursor-not-allowed"
                    }`}
                >
                  <span
                    className={`material-symbols-outlined text-base ${isCurrent ? "text-white" : isCompleted ? "text-[#6ee7b7]" : "text-[#474747]"
                      }`}
                    style={isCompleted ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {isCompleted ? "check_circle" : s.icon}
                  </span>
                  <div>
                    <div
                      className={`font-['Inter'] text-[9px] tracking-widest uppercase ${isCurrent ? "text-white" : isCompleted ? "text-[#6ee7b7]" : "text-[#474747]"
                        }`}
                    >
                      {s.label}
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[8px] text-[#2a2a2a]">
                      Step {s.id} of {STEPS.length}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Progress bar */}
          <div className="p-6 border-t border-[#1f1f1f]">
            <div className="flex justify-between mb-2">
              <span className="font-['Inter'] text-[9px] text-[#474747] uppercase tracking-widest">
                Progress
              </span>
              <span className="font-['Inter'] text-[9px] text-[#919191]">
                {Math.round(((step - 1) / (STEPS.length - 1)) * 100)}%
              </span>
            </div>
            <div className="h-px bg-[#1f1f1f] w-full">
              <div
                className="h-px bg-white transition-all duration-500"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-64 flex-1 min-h-[calc(100vh-56px)] flex flex-col">
          <div className="flex-1 p-10 max-w-3xl">
            {/* Step heading */}
            <div className="mb-10">
              <div className="font-['Inter'] text-[9px] tracking-widest uppercase text-[#474747] mb-2">
                Step {step} / {STEPS.length}
              </div>
              <h2 className="font-['Inter'] text-3xl font-bold tracking-tighter text-white">
                {STEPS[step - 1].label}
              </h2>
            </div>

            {/* Step content */}
            {step === 1 && <StepMetadata form={form} update={update} />}
            {step === 2 && <StepDescription form={form} update={update} />}
            {step === 3 && (
              <StepCodeSection
                form={form}
                update={update}
                prefix="main"
                heading="CODE STUBS"
                subtext="Starter templates shown to users. Include function signature and boilerplate only."
              />
            )}
            {step === 4 && (
              <StepCodeSection
                form={form}
                update={update}
                prefix="solution"
                heading="SOLUTIONS"
                subtext="Reference implementations used for validation. Not visible to users."
              />
            )}
            {step === 5 && <StepReview form={form} />}

            {error && (
              <div className="mt-6 border border-[#f87171]/30 bg-[#f87171]/5 p-4 font-['Inter'] text-[11px] text-[#f87171] tracking-wide">
                ERROR: {error}
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="sticky bottom-0 ml-0 bg-[#0a0a0a] border-t border-[#1f1f1f] px-10 py-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 font-['Inter'] text-[10px] tracking-widest uppercase text-[#474747] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Previous
            </button>

            <div className="flex gap-1">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`h-[2px] w-8 transition-colors ${s.id < step
                      ? "bg-[#6ee7b7]"
                      : s.id === step
                        ? "bg-white"
                        : "bg-[#1f1f1f]"
                    }`}
                />
              ))}
            </div>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                disabled={!canProceed()}
                className="flex items-center gap-2 font-['Inter'] text-[10px] tracking-widest uppercase bg-white text-black px-6 py-3 hover:bg-[#d4d4d4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 font-['Inter'] text-[10px] tracking-widest uppercase bg-[#6ee7b7] text-black px-6 py-3 hover:bg-[#34d399] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "DEPLOYING..." : "DEPLOY QUESTION"}
                <span className="material-symbols-outlined text-base">rocket_launch</span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}