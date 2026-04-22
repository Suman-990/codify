import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PFP_ICONS = [
  "", "person", "person_4", "face", "robot_2", "smart_toy",
  "person_2", "person_3", "support_agent", "neurology", "account_circle",
];

function getToken() {
  return localStorage.getItem("token");
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [editCountryValue, setEditCountryValue] = useState("");

  const [showPfpModal, setShowPfpModal] = useState(false);

  // Auth User check
  const currentUserId = localStorage.getItem("userId");
  const isCurrentUser = currentUserId === userId;

  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/user/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProfile(data);
      setEditCountryValue(data.country || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleCountrySave = async () => {
    if (!editCountryValue.trim()) return;
    try {
      await fetch(`/api/user/profile/country?country=${encodeURIComponent(editCountryValue)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setIsEditingCountry(false);
      setProfile(prev => ({ ...prev, country: editCountryValue }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePfp = async (id) => {
    try {
      await fetch(`/api/user/profile/picture?profilePictureId=${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setShowPfpModal(false);
      setProfile(prev => ({ ...prev, profilePictureId: id }));
      // Optionally update localStorage if it's the current user
      if (isCurrentUser) {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored.profilePictureId = id;
        localStorage.setItem("user", JSON.stringify(stored));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getHeatmapWeeks = () => {
    const dailyMap = profile?.dailySubmissions || {};
    const today = new Date();
    const days = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const count = dailyMap[isoStr] || 0;
      days.push({ date: d, count });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const heatmapWeeks = getHeatmapWeeks();

  const getHeatmapColor = (count) => {
    if (count === 0) return "bg-[#0e0e0e]"; // background or surface-lowest
    if (count <= 2) return "bg-[#2a2a2a]"; // surface-high
    if (count <= 5) return "bg-[#919191]"; // outline
    return "bg-[#ffffff]"; // primary
  };

  if (loading) {
    return <div className="min-h-screen bg-[#131313] text-[#e2e2e2] flex items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-[#131313] text-[#e2e2e2] flex items-center justify-center">Profile not found</div>;
  }

  const {
    username,
    country,
    profilePictureId,
    totalSubmissions,
    acceptanceRate,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    recentSubmissions,
    sharedSolutionsCount,
    discussionsCount,
    activeDays,
    rankPercentage,
    rank,
    joined
  } = profile;

  // Format joined date
  const joinedDate = new Date(joined);
  const joinedStr = !isNaN(joinedDate.valueOf())
    ? joinedDate.toLocaleString("default", { month: "short", year: "numeric" }).toUpperCase()
    : "—";

  // Accept rate calculation
  const acceptRateStr = (acceptanceRate || 0).toFixed(1) + "%";

  // For the pie chart, simple conic gradient string
  // Total is out of say, arbitrary max limits for the pie visual relative to a sum. Let's make an approximation.
  const easyPct = totalSolved ? (easySolved / totalSolved) * 100 : 0;
  const mediumPct = totalSolved ? (mediumSolved / totalSolved) * 100 : 0;
  const pieGradient = `conic-gradient(
      #ffffff 0% ${easyPct}%,
      #919191 ${easyPct}% ${easyPct + mediumPct}%,
      #353535 ${easyPct + mediumPct}% 100%
  )`;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-['Inter'] selection:bg-white selection:text-black pb-20">

      {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-10 h-16 bg-[#131313] fixed top-0 z-50 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-12">
          <span
            className="text-xl font-bold tracking-tighter text-white uppercase font-['Space_Grotesk'] cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            Codify
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="font-['Space_Grotesk'] text-[11px] tracking-widest uppercase text-[#474747] hover:text-white"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="pt-32 px-6 lg:px-10 max-w-[1440px] mx-auto grid grid-cols-12 gap-10">

        {/* Left Column: Identity & Stats */}
        <aside className="col-span-12 lg:col-span-4 space-y-10">

          <section className="bg-[#1f1f1f] p-8 border border-[#2a2a2a]">
            <div className="flex items-start gap-6 mb-8 relative">
              <div className="w-24 h-24 bg-[#0e0e0e] border border-[#474747] p-1 flex items-center justify-center relative group">
                {profilePictureId ? (
                  <img
                    src={`/src/assets/pfp/${profilePictureId}.png`}
                    alt="Avatar"
                    className="w-full h-full object-cover grayscale"
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-[#919191]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {PFP_ICONS[profilePictureId] || "person"}
                  </span>
                )}
                {isCurrentUser && (
                  <button
                    onClick={() => setShowPfpModal(true)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-white">edit</span>
                  </button>
                )}
              </div>

              <div className="flex-1">
                <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tighter uppercase leading-none mb-1 text-white truncate max-w-[200px]" title={username}>
                  {username || "UNKNOWN"}
                </h1>
                <div className="flex gap-3 mt-4">
                  {rank > 0 && <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-1 bg-[#2a2a2a] text-[#c6c6c6]">Rank #{rank.toLocaleString()}</span>}
                  {rankPercentage > 0 && <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-1 bg-white text-black font-bold">Top {rankPercentage}%</span>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs tracking-widest uppercase text-[#919191]">
                <span>Location</span>
                {isEditingCountry ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className="bg-[#131313] text-white border border-[#474747] px-2 py-1 outline-none text-xs w-28 placeholder-[#474747]"
                      value={editCountryValue}
                      onChange={(e) => setEditCountryValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCountrySave() }}
                      onBlur={handleCountrySave}
                      placeholder="Enter country..."
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="text-[#e2e2e2]">{country || "Unknown"}</span>
                    {isCurrentUser && (
                      <button onClick={() => setIsEditingCountry(true)} className="text-[#474747] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-xs tracking-widest uppercase text-[#919191]">
                <span>Joined</span>
                <span className="text-[#e2e2e2]">{joinedStr}</span>
              </div>
            </div>
          </section>

          {/* Statistics Circle */}
          <section className="bg-[#1f1f1f] p-8 border border-[#2a2a2a]">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold tracking-[0.2em] uppercase mb-8 text-[#e2e2e2]">Solved Statistics</h3>
            <div className="flex items-center gap-10">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="w-full h-full rounded-full" style={{ background: pieGradient }}></div>
                <div className="absolute inset-3 bg-[#1f1f1f] rounded-full flex flex-col items-center justify-center">
                  <span className="font-['Space_Grotesk'] text-2xl font-bold text-white">{totalSolved}</span>
                  <span className="text-[8px] tracking-widest text-[#919191] uppercase">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#ffffff]"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-[#919191]">Easy</span>
                    <span className="text-sm font-bold text-[#e2e2e2]">{easySolved}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#919191]"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-[#919191]">Medium</span>
                    <span className="text-sm font-bold text-[#e2e2e2]">{mediumSolved}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#0e0e0e] border border-[#474747]"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-[#919191]">Hard</span>
                    <span className="text-sm font-bold text-[#e2e2e2]">{hardSolved}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Community Activity */}
          <section className="bg-[#1f1f1f] p-8 border border-[#2a2a2a]">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold tracking-[0.2em] uppercase mb-8 text-[#e2e2e2]">Community Activity</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#ffffff]"></div>
                  <span className="text-[10px] uppercase tracking-widest text-[#919191]">Active Days</span>
                </div>
                <span className="text-sm font-bold text-[#e2e2e2]">{activeDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#919191]"></div>
                  <span className="text-[10px] uppercase tracking-widest text-[#919191]">Shared Solutions</span>
                </div>
                <span className="text-sm font-bold text-[#e2e2e2]">{sharedSolutionsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#0e0e0e] border border-[#474747]"></div>
                  <span className="text-[10px] uppercase tracking-widest text-[#919191]">Discussions Joined</span>
                </div>
                <span className="text-sm font-bold text-[#e2e2e2]">{discussionsCount}</span>
              </div>
            </div>
          </section>

        </aside>

        {/* Right Column: Contribution & Activity */}
        <div className="col-span-12 lg:col-span-8 space-y-10">

          {/* Heatmap */}
          <section className="bg-[#1f1f1f] p-8 overflow-hidden border border-[#2a2a2a]">
            <div className="flex justify-between items-end mb-8">
              <h3 className="font-['Space_Grotesk'] text-sm font-bold tracking-[0.2em] uppercase text-[#e2e2e2]">
                {totalSubmissions.toLocaleString()} Contributions in the last year
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[8px] tracking-widest uppercase text-[#919191]">Less</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#0e0e0e]"></div>
                  <div className="w-2 h-2 bg-[#2a2a2a]"></div>
                  <div className="w-2 h-2 bg-[#919191]"></div>
                  <div className="w-2 h-2 bg-[#ffffff]"></div>
                </div>
                <span className="text-[8px] tracking-widest uppercase text-[#919191]">More</span>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-4" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {heatmapWeeks.map((week, idx) => (
                <div key={idx} className="flex flex-col gap-1 flex-shrink-0">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className={`w-3 h-3 ${getHeatmapColor(day.count)} outline outline-1 outline-white/5 transition-opacity hover:opacity-75`}
                      title={`${day.count} submissons on ${day.date.toDateString()}`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-4 text-[9px] uppercase tracking-widest text-[#474747]">
              {/* Very primitive month rendering, for real projects we'd map week array indices */}
              <span>12 Months Ago</span>
              <span>Today</span>
            </div>
          </section>

          {/* Recent Submissions */}
          <section className="bg-[#1f1f1f] border border-[#2a2a2a]">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-['Space_Grotesk'] text-sm font-bold tracking-[0.2em] uppercase text-[#e2e2e2]">Recent Submissions</h3>
              <button
                className="text-[10px] tracking-widest uppercase text-[#919191] hover:text-white transition-colors"
                onClick={() => navigate("/dashboard")}
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {(!recentSubmissions || recentSubmissions.length === 0) ? (
                <div className="px-8 py-8 text-center text-sm text-[#474747]">No recent submissions found.</div>
              ) : (
                recentSubmissions.map((sub) => (
                  <div
                    key={sub.submissionId}
                    onClick={() => navigate(`/submissions/${sub.submissionId}`)}
                    className="px-8 py-5 hover:bg-[#353535] transition-colors group cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-['Space_Grotesk'] font-bold uppercase tracking-tight group-hover:text-white text-[#e2e2e2]">
                        {sub.questionTitle}
                      </span>
                      <span className="text-[10px] tracking-widest text-[#919191] uppercase">
                        Problem #{sub.questionId} • {sub.language}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] tracking-widest uppercase font-bold 
                        ${sub.status === 'ACCEPTED' ? 'text-[#ffffff]' : 'text-[#f87171]'}
                      `}>
                        {sub.status.replace("_", " ")}
                      </span>
                      <span className="text-[9px] tracking-widest text-[#474747] uppercase">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-6 aspect-square flex flex-col items-center justify-center text-center gap-4 hover:border-[#474747] transition-colors">
              <span className="material-symbols-outlined text-4xl text-[#919191]">temp_preferences_custom</span>
              <div className="space-y-1">
                <p className="font-['Space_Grotesk'] font-bold uppercase text-xs tracking-widest text-[#e2e2e2]">Grinded for</p>
                <p className="text-[9px] text-[#474747] uppercase tracking-[0.1em]">{activeDays} Days</p>
              </div>
            </div>

            <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-6 aspect-square flex flex-col items-center justify-center text-center gap-4 hover:border-[#474747] transition-colors">
              <span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <div className="space-y-1">
                <p className="font-['Space_Grotesk'] font-bold uppercase text-xs tracking-widest text-[#e2e2e2]">
                  {rankPercentage > 0 ? `Global Top ${rankPercentage}%` : "Unranked"}
                </p>
                <p className="text-[9px] text-[#474747] uppercase tracking-[0.1em]">Current Ranking</p>
              </div>
            </div>

            <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-6 aspect-square flex flex-col items-center justify-center text-center gap-4 hover:border-[#474747] transition-colors">
              <span className="material-symbols-outlined text-4xl text-[#919191]">terminal</span>
              <div className="space-y-1">
                <p className="font-['Space_Grotesk'] font-bold uppercase text-xs tracking-widest text-[#e2e2e2]">Acceptance Rate</p>
                <p className="text-[9px] text-[#474747] uppercase tracking-[0.1em]">{acceptRateStr}</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* PFP Editor Modal */}
      {showPfpModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] flex flex-col max-w-md w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-[#919191] hover:text-white"
              onClick={() => setShowPfpModal(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest text-white mb-6">Choose Avatar</h2>

            <div className="grid grid-cols-4 gap-4">
              {PFP_ICONS.map((icon, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangePfp(idx)}
                  className={`w-16 h-16 border flex items-center justify-center transition-all 
                        ${profilePictureId === idx ? 'border-white bg-[#353535]' : 'border-[#2a2a2a] hover:border-[#919191] bg-[#131313]'}
                     `}
                >
                  <img
                    src={`/src/assets/pfp/${idx}.png`}
                    className="w-full h-full object-cover grayscale opacity-60 hover:opacity-100"
                    alt="icon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="material-symbols-outlined text-2xl text-[#c6c6c6] hidden" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon || "person"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
