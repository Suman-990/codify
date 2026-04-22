import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const TAGS = [
  { label: "Arrays", icon: "grid_view", value: "array" },
  { label: "Strings", icon: "segment", value: "string" },
  { label: "Linked List", icon: "linear_scale", value: "linked list" },
  { label: "Trees", icon: "account_tree", value: "tree" },
  { label: "Graphs", icon: "hub", value: "graph" },
  { label: "Dynamic Programming", icon: "account_tree", value: "dynamic programming" },
  { label: "Backtracking", icon: "undo", value: "backtracking" },
  { label: "Binary Search", icon: "manage_search", value: "binary search" },
  { label: "Stack", icon: "layers", value: "stack" },
  { label: "Heap", icon: "filter_list", value: "heap" },
  { label: "Sorting", icon: "sort", value: "sorting" },
  { label: "Greedy", icon: "bolt", value: "greedy" },
];

const DIFFICULTY_FILTERS = ["ALL", "EASY", "MEDIUM", "HARD"];

const PFP_ICONS = [
  "", "person", "person_4", "face", "robot_2", "smart_toy",
  "person_2", "person_3", "support_agent", "neurology", "account_circle",
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

function acceptanceRate(q) {
  if (!q.totalSubmissions || q.totalSubmissions === 0) return "—";
  return ((q.totalSolved / q.totalSubmissions) * 100).toFixed(1) + "%";
}

function DifficultyBadge({ value }) {
  const map = {
    EASY: "text-[#6ee7b7] bg-[#6ee7b7]/10 border border-[#6ee7b7]/20",
    MEDIUM: "text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20",
    HARD: "text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20",
  };
  return (
    <span className={`font-['Space_Grotesk'] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 ${map[value?.toUpperCase()] ?? "text-[#919191] bg-[#1f1f1f] border border-[#2a2a2a]"}`}>
      {value}
    </span>
  );
}

function StatusIcon({ solved, attempted }) {
  if (solved) return <span className="material-symbols-outlined text-[#6ee7b7] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
  if (attempted) return <span className="material-symbols-outlined text-[#f87171] text-lg">cancel</span>;
  return <span className="material-symbols-outlined text-[#2a2a2a] text-lg">radio_button_unchecked</span>;
}

function ProfileAvatar({ user, size = "sm", onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "text-xl" : "text-2xl";
  const imgSrc = `/src/assets/pfp/${user?.profilePictureId}.png`;

  return (
    <button
      onClick={onClick}
      className={`${sizeClass} bg-[#2a2a2a] flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-white/20 transition-all`}
      title="View profile"
    >
      {!imgFailed && user?.profilePictureId ? (
        <img
          src={imgSrc}
          alt={user.userName}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover grayscale"
        />
      ) : (
        <span className={`material-symbols-outlined ${iconSize} text-[#919191]`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {PFP_ICONS[user?.profilePictureId] || "person"}
        </span>
      )}
    </button>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#1f1f1f]">
      <td className="py-5 px-4"><div className="w-5 h-5 bg-[#1f1f1f] rounded-full animate-pulse" /></td>
      <td className="py-5 px-4">
        <div className="space-y-2">
          <div className="h-4 bg-[#1f1f1f] rounded w-48 animate-pulse" />
          <div className="h-3 bg-[#1a1a1a] rounded w-28 animate-pulse" />
        </div>
      </td>
      <td className="py-5 px-4 text-center"><div className="h-5 bg-[#1f1f1f] rounded w-16 mx-auto animate-pulse" /></td>
      <td className="py-5 px-4 text-center"><div className="h-4 bg-[#1a1a1a] rounded w-12 mx-auto animate-pulse" /></td>
      <td className="py-5 px-4 text-right"><div className="h-4 bg-[#1a1a1a] rounded w-10 ml-auto animate-pulse" /></td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // Get user from localStorage synchronously
  const storedUser = getStoredUser();
  const [currentUserId, setCurrentUserId] = useState(storedUser?.id || localStorage.getItem("userId"));

  // User profile (full)
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Questions
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficulty, setDifficulty] = useState("ALL");
  const [activeTag, setActiveTag] = useState(null);

  const searchTimer = useRef(null);

  // Check auth on mount
  useEffect(() => {
    const token = getToken();
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
    } else {
      setCurrentUserId(userId);
    }
  }, [navigate]);

  // ── Fetch user profile ──
  useEffect(() => {
    if (!currentUserId) return;

    setProfileLoading(true);
    fetch(`/api/user/profile/basic/${currentUserId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch profile");
        return r.json();
      })
      .then((data) => {
        setUserProfile(data);
        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        // If profile fetch fails, try to use stored user data
        const stored = getStoredUser();
        if (stored) setUserProfile(stored);
      })
      .finally(() => setProfileLoading(false));
  }, [currentUserId]);

  // ── Debounce search ──
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch questions ──
  const fetchQuestions = useCallback(async () => {
    setQLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      let url;

      if (debouncedSearch.trim()) {
        url = `/api/questions/search?query=${encodeURIComponent(debouncedSearch)}&page=${page}&size=${PAGE_SIZE}`;
      } else if (activeTag) {
        url = `/api/questions/filter/tag?tag=${encodeURIComponent(activeTag)}&page=${page}&size=${PAGE_SIZE}`;
      } else if (difficulty !== "ALL") {
        url = `/api/questions/filter/difficulty?difficulty=${difficulty}&page=${page}&size=${PAGE_SIZE}`;
      } else {
        url = `/api/questions?page=${page}&size=${PAGE_SIZE}`;
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch questions");

      const data = await res.json();

      setQuestions(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length < PAGE_SIZE) {
        setTotalPages(page + 1);
      } else {
        setTotalPages(page + 2);
      }
    } catch (e) {
      console.error(e);
      setQuestions([]);
    } finally {
      setQLoading(false);
    }
  }, [debouncedSearch, activeTag, difficulty, page]);

  useEffect(() => {
    if (currentUserId) {
      fetchQuestions();
    }
  }, [fetchQuestions, currentUserId]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [difficulty, activeTag]);

  // ── Derived stats ──
  const profileData = userProfile || storedUser;
  const solvedSet = new Set(profileData?.solvedQuestions ?? []);
  const attemptedSet = new Set(profileData?.attemptedQuestions ?? []);
  const totalSolved = profileData?.totalSolved ?? 0;
  const totalSubs = profileData?.totalSubmissions ?? 0;
  const easySolved = profileData?.easySolved ?? 0;
  const medSolved = profileData?.mediumSolved ?? 0;
  const hardSolved = profileData?.hardSolved ?? 0;
  const acceptRate = totalSubs > 0 ? ((totalSolved / totalSubs) * 100).toFixed(1) + "%" : "—";

  // ── Pagination helpers ──
  const visiblePages = () => {
    const pages = [];
    const start = Math.max(0, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-['Inter']">

      {/* ── Top Nav ── */}
      <nav className="bg-[#131313] flex justify-between items-center w-full px-10 h-16 sticky top-0 z-50 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-10">
          <span className="text-xl font-bold tracking-tighter text-white uppercase font-['Space_Grotesk']">
            Codify
          </span>
          <div className="hidden lg:flex items-center gap-1">
            {["Problems", "Contests", "Discuss", "Leaderboard"].map((item) => (
              <button
                key={item}
                className={`px-4 py-1.5 font-['Space_Grotesk'] text-[11px] tracking-widest uppercase transition-colors ${item === "Problems" ? "text-white" : "text-[#474747] hover:text-[#919191]"
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Search (desktop) */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#474747] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTag(null); setDifficulty("ALL"); }}
              placeholder="Search problems..."
              className="bg-[#1b1b1b] border border-[#2a2a2a] focus:border-[#474747] text-sm pl-9 pr-4 py-2 w-56 placeholder:text-[#353535] focus:outline-none transition-colors font-['Inter'] text-[#e2e2e2]"
            />
          </div>

          {/* Profile avatar */}
          <ProfileAvatar
            user={profileData}
            onClick={() => navigate(`/profile/${currentUserId}`)}
          />
        </div>
      </nav>

      <main className="flex min-h-[calc(100vh-64px)]">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex w-60 flex-shrink-0 bg-[#0e0e0e] border-r border-[#1f1f1f] flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">

          {/* Difficulty filter */}
          <div className="p-6 border-b border-[#1f1f1f]">
            <h3 className="font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.3em] text-[#474747] mb-4">
              Difficulty
            </h3>
            <div className="flex flex-col gap-1">
              {DIFFICULTY_FILTERS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setActiveTag(null); setSearch(""); }}
                  className={`flex items-center justify-between px-3 py-2 text-[11px] font-['Space_Grotesk'] uppercase tracking-widest transition-colors ${difficulty === d && !activeTag && !debouncedSearch
                      ? "bg-white text-black"
                      : "text-[#474747] hover:text-white hover:bg-[#1f1f1f]"
                    }`}
                >
                  <span>{d}</span>
                  {d !== "ALL" && (
                    <span className={`text-[9px] ${d === "EASY" ? "text-[#6ee7b7]" : d === "MEDIUM" ? "text-[#fbbf24]" : "text-[#f87171]"
                      }`}>
                      {d === "EASY" ? easySolved : d === "MEDIUM" ? medSolved : hardSolved}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tag filter */}
          <div className="p-6 flex-1">
            <h3 className="font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.3em] text-[#474747] mb-4">
              Tags
            </h3>
            <nav className="flex flex-col gap-0.5">
              {TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => { setActiveTag(activeTag === tag.value ? null : tag.value); setDifficulty("ALL"); setSearch(""); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left ${activeTag === tag.value
                      ? "bg-[#1f1f1f] text-white border-l-2 border-white"
                      : "text-[#474747] hover:text-[#c6c6c6] hover:bg-[#1a1a1a] border-l-2 border-transparent"
                    }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{tag.icon}</span>
                  <span className="font-['Inter']">{tag.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Progress block */}
          <div className="p-6 border-t border-[#1f1f1f]">
            <div className="bg-[#1f1f1f] p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
                  Solved
                </span>
                <span className="font-['Space_Grotesk'] text-[10px] text-white font-bold">
                  {totalSolved}
                </span>
              </div>
              {/* Mini breakdown */}
              <div className="space-y-2">
                {[
                  { label: "Easy", val: easySolved, color: "#6ee7b7" },
                  { label: "Medium", val: medSolved, color: "#fbbf24" },
                  { label: "Hard", val: hardSolved, color: "#f87171" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-['Inter'] text-[10px] text-[#474747] flex-1">{label}</span>
                    <span className="font-['Inter'] text-[10px]" style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="h-px w-full bg-[#2a2a2a]" />
              <div className="flex justify-between">
                <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
                  Accept Rate
                </span>
                <span className="font-['Space_Grotesk'] text-[10px] text-white font-bold">
                  {acceptRate}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <section className="flex-1 p-8 lg:p-12 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">

            {/* Page header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <div>
                <h1 className="font-['Space_Grotesk'] text-4xl lg:text-5xl font-bold tracking-tighter text-white mb-3">
                  Problem Archive
                </h1>
                <p className="text-[#474747] font-['Inter'] text-sm max-w-md leading-relaxed">
                  Curated computational challenges designed to test technical rigor and algorithmic efficiency.
                </p>
              </div>

              {/* Stats cards */}
              <div className="flex gap-3 flex-shrink-0">
                <div className="h-20 w-36 bg-[#1f1f1f] border border-[#2a2a2a] p-4 flex flex-col justify-between">
                  <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
                    Submissions
                  </span>
                  <span className="text-xl font-['Space_Grotesk'] font-bold text-white">
                    {profileLoading ? "—" : totalSubs.toLocaleString()}
                  </span>
                </div>
                <div className="h-20 w-36 bg-[#1f1f1f] border border-[#2a2a2a] p-4 flex flex-col justify-between">
                  <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
                    Acceptance
                  </span>
                  <span className="text-xl font-['Space_Grotesk'] font-bold text-white">
                    {profileLoading ? "—" : acceptRate}
                  </span>
                </div>
              </div>
            </header>

            {/* Mobile search */}
            <div className="relative lg:hidden mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#474747] text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveTag(null); setDifficulty("ALL"); }}
                placeholder="Search problems..."
                className="w-full bg-[#1b1b1b] border border-[#2a2a2a] text-sm pl-9 pr-4 py-3 placeholder:text-[#353535] focus:outline-none focus:border-[#474747] transition-colors text-[#e2e2e2]"
              />
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* Active filter chips */}
              {debouncedSearch && (
                <FilterChip label={`"${debouncedSearch}"`} onRemove={() => setSearch("")} />
              )}
              {activeTag && (
                <FilterChip label={activeTag} onRemove={() => setActiveTag(null)} />
              )}
              {difficulty !== "ALL" && !activeTag && !debouncedSearch && (
                <FilterChip label={difficulty} onRemove={() => setDifficulty("ALL")} />
              )}

              <div className="ml-auto font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
                {qLoading ? "Loading..." : `${questions.length} results`}
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#1f1f1f]">
                    <th className="pb-4 px-4 font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.2em] text-[#474747] w-12 text-left">
                      Status
                    </th>
                    <th className="pb-4 px-4 font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.2em] text-[#474747] text-left">
                      Title
                    </th>
                    <th className="pb-4 px-4 font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.2em] text-[#474747] w-28 text-center">
                      Difficulty
                    </th>
                    <th className="pb-4 px-4 font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.2em] text-[#474747] w-28 text-center hidden md:table-cell">
                      Category
                    </th>
                    <th className="pb-4 px-4 font-['Space_Grotesk'] text-[9px] uppercase tracking-[0.2em] text-[#474747] w-24 text-right">
                      Accept
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {qLoading
                    ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                    : questions.length === 0
                      ? (
                        <tr>
                          <td colSpan={5} className="py-24 text-center">
                            <div className="space-y-3">
                              <span className="material-symbols-outlined text-4xl text-[#2a2a2a]">search_off</span>
                              <p className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#474747]">
                                No problems found
                              </p>
                            </div>
                          </td>
                        </tr>
                      )
                      : questions.map((q) => (
                        <QuestionRow
                          key={q.id}
                          question={q}
                          solved={solvedSet.has(q.id)}
                          attempted={attemptedSet.has(q.id)}
                          onClick={() => navigate(`/problems/${q.id}`)}
                        />
                      ))
                  }
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!qLoading && questions.length > 0 && (
              <div className="mt-12 flex items-center justify-between">
                <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
                  Page {page + 1}
                </span>
                <div className="flex gap-1">
                  <PageBtn
                    icon="chevron_left"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  />
                  {visiblePages().map((p) => (
                    <PageBtn
                      key={p}
                      label={p + 1}
                      active={p === page}
                      onClick={() => setPage(p)}
                    />
                  ))}
                  <PageBtn
                    icon="chevron_right"
                    disabled={questions.length < PAGE_SIZE}
                    onClick={() => setPage((p) => p + 1)}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ── Question Row ───────────────────────────────────────────────────────────────
function QuestionRow({ question, solved, attempted, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="group hover:bg-[#1a1a1a] transition-colors cursor-pointer"
    >
      {/* Status */}
      <td className="py-5 px-4">
        <StatusIcon solved={solved} attempted={attempted} />
      </td>

      {/* Title + tags */}
      <td className="py-5 px-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-white font-['Inter'] font-medium text-sm group-hover:underline underline-offset-4 decoration-1 decoration-[#474747]">
            {question.id}. {question.title}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(question.tags ?? []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] text-[#474747] uppercase tracking-widest bg-[#1f1f1f] border border-[#2a2a2a] px-1.5 py-0.5 font-['Space_Grotesk']"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </td>

      {/* Difficulty */}
      <td className="py-5 px-4 text-center">
        <DifficultyBadge value={question.difficulty} />
      </td>

      {/* Category */}
      <td className="py-5 px-4 text-center hidden md:table-cell">
        <span className="font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#474747]">
          {question.category ?? "—"}
        </span>
      </td>

      {/* Acceptance */}
      <td className="py-5 px-4 text-right">
        <span className="font-['Space_Grotesk'] text-xs text-[#474747]">
          {acceptanceRate(question)}
        </span>
      </td>
    </tr>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 bg-[#1f1f1f] border border-[#2a2a2a] font-['Space_Grotesk'] text-[9px] uppercase tracking-widest text-[#c6c6c6] px-2.5 py-1.5">
      {label}
      <button onClick={onRemove} className="text-[#474747] hover:text-white transition-colors leading-none ml-0.5">
        ×
      </button>
    </span>
  );
}

// ── Pagination button ─────────────────────────────────────────────────────────
function PageBtn({ icon, label, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 flex items-center justify-center transition-colors font-['Space_Grotesk'] text-xs font-bold ${active
          ? "bg-white text-black"
          : disabled
            ? "bg-[#1a1a1a] text-[#2a2a2a] cursor-not-allowed"
            : "bg-[#1f1f1f] text-[#c6c6c6] hover:bg-[#2a2a2a] hover:text-white"
        }`}
    >
      {icon
        ? <span className="material-symbols-outlined text-[18px]">{icon}</span>
        : label
      }
    </button>
  );
}