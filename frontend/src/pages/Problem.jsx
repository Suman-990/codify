import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";

// Language configurations
const LANGUAGES = {
  java: { name: "Java", ext: "java", endpoint: "/api/submit/java" },
  python: { name: "Python", ext: "py", endpoint: "/api/submit/python" },
  cpp: { name: "C++", ext: "cpp", endpoint: "/api/submit/cpp" }
};

export default function Problem() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description"); // description, solution, submissions, discuss
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [solutions, setSolutions] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);

  // Custom States
  const [solutionsPage, setSolutionsPage] = useState(0);
  const [fetchedSolutions, setFetchedSolutions] = useState([]);
  const [hasMoreSolutions, setHasMoreSolutions] = useState(true);

  const [discussionsPage, setDiscussionsPage] = useState(0);
  const [discussions, setDiscussions] = useState([]);
  const [hasMoreDiscussions, setHasMoreDiscussions] = useState(true);
  const [newDiscussion, setNewDiscussion] = useState("");

  const pollingIntervalRef = useRef(null);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Fetch question data
  useEffect(() => {
    fetchQuestion();
    fetchUserSubmissions();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [questionId]);

  useEffect(() => {
    if (activeTab === "solution" && fetchedSolutions.length === 0) {
      fetchSolutions(0);
    } else if (activeTab === "discuss" && discussions.length === 0) {
      fetchDiscussions(0);
    }
  }, [activeTab]);

  const fetchSolutions = async (page) => {
    try {
      const response = await fetch(`/api/solutions/question/${questionId}?page=${page}&size=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (page === 0) setFetchedSolutions(data);
        else setFetchedSolutions(prev => [...prev, ...data]);
        if (data.length < 5) setHasMoreSolutions(false);
      }
    } catch (err) { console.error(err); }
  };

  const fetchDiscussions = async (page) => {
    try {
      const response = await fetch(`/api/discussions/question/${questionId}?page=${page}&size=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (page === 0) setDiscussions(data);
        else setDiscussions(prev => [...prev, ...data]);
        if (data.length < 20) setHasMoreDiscussions(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.trim()) return;
    try {
      const payload = {
        questionId: parseInt(questionId),
        userId: parseInt(userId || "1"),
        userName: JSON.parse(localStorage.getItem("user") || "{}").username || "Developer",
        userProfilePicture: JSON.parse(localStorage.getItem("user") || "{}").profilePictureId || 0,
        content: newDiscussion
      };
      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setNewDiscussion("");
        setDiscussionsPage(0);
        setHasMoreDiscussions(true);
        fetchDiscussions(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch question");
      const data = await response.json();
      setQuestion(data);

      // Load solution code for default language
      loadSolutionCode(data, "java");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async () => {
    try {
      const response = await fetch(`/api/submissions/user/${userId}/question/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubmissions(data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const loadSolutionCode = (q, language) => {
    const solutionKey = `solution_${language}`;
    const mainKey = `main_${language}`;
    let codeContent = "";

    if (q[solutionKey]) {
      codeContent = q[solutionKey];
    } else if (q[mainKey]) {
      codeContent = q[mainKey];
    } else {
      // Default template based on language
      codeContent = getDefaultTemplate(language);
    }

    setCode(codeContent);
  };

  const getDefaultTemplate = (language) => {
    const templates = {
      java: `public class Solution {
    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }
}`,
      python: `class Solution:
    def solve(self, nums):
        # Write your solution here
        return 0`,
      cpp: `class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};`
    };
    return templates[language] || "";
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    if (question) {
      loadSolutionCode(question, language);
    }
  };

  const startPolling = (submissionId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) return;

        const submission = await response.json();

        if (submission.status === "EXECUTED") {
          // Stop polling
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;

          // Redirect to submission page
          navigate(`/submissions/${submissionId}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Please write some code before submitting");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const submissionData = {
        userCode: code,
        questionId: parseInt(questionId),
        userId: parseInt(userId)
      };

      const endpoint = LANGUAGES[selectedLanguage].endpoint;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Submission failed");
      }

      const submissionId = await response.json();

      // Start polling for results
      startPolling(submissionId);


    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleRun = () => {
    alert("Run functionality coming soon! Please use Submit to test your code.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#474747] font-mono text-xs tracking-widest">LOADING PROBLEM...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[#474747] mb-4">error</span>
          <p className="text-white mb-2">Problem not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[#6ee7b7] text-sm hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-[#1F1F1F] flex items-center justify-between w-full px-6 h-14 border-b border-white/10 z-40 flex-shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-[#474747] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
            <span className="text-xs tracking-widest uppercase font-bold">Back</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-white font-bold tracking-tighter text-sm">
            PROBLEM {question.id}
          </span>
        </div>

        <div className="flex items-center gap-8 h-full">
          {["description", "solution", "submissions", "discuss"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-full flex items-center border-b-2 transition-colors px-2 ${activeTab === tab
                  ? "border-white text-white font-bold"
                  : "border-transparent text-[#474747] hover:text-white"
                }`}
            >
              <span className="text-xs tracking-widest uppercase">
                {tab === "submissions" ? "My Submissions" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-[#c6c6c6] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">terminal</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane */}
        <section className="w-[45%] bg-[#131313] border-r border-white/5 overflow-y-auto">
          {activeTab === "description" && (
            <div className="px-8 py-8">
              {/* Difficulty Badge */}
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 text-[10px] tracking-widest uppercase font-bold border ${question.difficulty === "EASY" ? "text-[#6ee7b7] border-[#6ee7b7]/30 bg-[#6ee7b7]/5" :
                    question.difficulty === "MEDIUM" ? "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/5" :
                      "text-[#f87171] border-[#f87171]/30 bg-[#f87171]/5"
                  }`}>
                  {question.difficulty}
                </span>
                <span className="text-[#474747] text-[10px] tracking-widest uppercase">
                  ID: {question.id}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tighter text-white mb-6">
                {question.id}. {question.title}
              </h1>

              {/* Description */}
              <div className="prose prose-invert max-w-none text-[#c6c6c6] leading-relaxed space-y-6">
                <div dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br/>') }} />

                {/* Example */}
                {(question.exampleInput || question.exampleOutput) && (
                  <div className="bg-[#1f1f1f] p-6 space-y-4 mt-6">
                    <h3 className="text-white text-xs tracking-widest uppercase font-bold">Example</h3>
                    <div className="font-mono text-sm bg-[#0e0e0e] p-4 border-l-2 border-white">
                      {question.exampleInput && (
                        <div className="mb-2">
                          <span className="text-[#474747]">Input:</span> {question.exampleInput}
                        </div>
                      )}
                      {question.exampleOutput && (
                        <div>
                          <span className="text-[#474747]">Output:</span> {question.exampleOutput}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {question.constraints && question.constraints.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-white text-xs tracking-widest uppercase font-bold">Constraints</h3>
                    <ul className="list-none space-y-2 text-sm">
                      {question.constraints.map((constraint, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-white mt-1.5 w-1.5 h-1.5 bg-white block flex-shrink-0 rounded-full" />
                          <span className="text-[#c6c6c6]">{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {question.tags.map((tag) => (
                      <span key={tag} className="text-[9px] text-[#474747] uppercase tracking-widest bg-[#1f1f1f] border border-[#2a2a2a] px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "solution" && (
            <div className="px-8 py-8 h-full flex flex-col">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tighter text-white mb-6">
                Community Solutions
              </h2>
              {fetchedSolutions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-[#2a2a2a] mb-4">code_blocks</span>
                  <p className="text-[#474747] text-sm">No solutions shared yet</p>
                </div>
              ) : (
                <div className="space-y-6 flex-1 overflow-y-auto pb-4 pr-2">
                  {fetchedSolutions.map((sol) => (
                    <div key={sol.id} className="bg-[#1f1f1f] border border-[#2a2a2a] p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/profile/${sol.userId}`)}
                        >
                          <div className="w-8 h-8 bg-[#2a2a2a] overflow-hidden rounded-full border border-[#474747]">
                            <img src={`/src/assets/pfp/${sol.userProfilePicture || 0}.png`} alt="☣" className="w-full h-full object-cover grayscale" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold hover:underline">{sol.userName}</p>
                            <p className="text-[#474747] text-[10px] uppercase tracking-widest">{new Date(sol.createdAt || Date.now()).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#2a2a2a] text-[#c6c6c6] text-[10px] px-2 py-1 uppercase tracking-widest">
                            {LANGUAGES[sol.language]?.name || sol.language}
                          </span>
                          <span className="bg-[#131313] text-[#919191] text-[10px] px-2 py-1 uppercase tracking-widest border border-[#2a2a2a]">
                            {sol.executionTime}ms
                          </span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h4 className="text-[#919191] text-[10px] uppercase tracking-widest mb-2 font-bold">Approach</h4>
                        <p className="text-[#c6c6c6] text-sm leading-relaxed whitespace-pre-wrap">{sol.aproach}</p>
                      </div>
                      <div className="flex gap-4 mb-4">
                        <div className="flex flex-col">
                          <span className="text-[#474747] text-[10px] uppercase tracking-widest">Time</span>
                          <span className="text-[#6ee7b7] text-xs font-mono">{sol.timeComplexity}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#474747] text-[10px] uppercase tracking-widest">Space</span>
                          <span className="text-[#6ee7b7] text-xs font-mono">{sol.spaceComplexity}</span>
                        </div>
                      </div>
                      <div className="bg-[#0e0e0e] p-4 text-xs font-mono text-[#e2e2e2] overflow-x-auto border border-[#2a2a2a]">
                        <pre>{sol.code}</pre>
                      </div>
                    </div>
                  ))}
                  {hasMoreSolutions && (
                    <button
                      onClick={() => {
                        const nextPage = solutionsPage + 1;
                        setSolutionsPage(nextPage);
                        fetchSolutions(nextPage);
                      }}
                      className="w-full py-3 bg-[#2a2a2a] text-white text-xs tracking-widest uppercase font-bold hover:bg-[#353535] transition-colors"
                    >
                      Load More
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="px-8 py-8">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tighter text-white mb-6">
                My Submissions
              </h2>
              {userSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-[#2a2a2a] mb-4">history</span>
                  <p className="text-[#474747] text-sm">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userSubmissions.map((sub) => (
                    <div
                      key={sub.submissionId}
                      onClick={() => navigate(`/submissions/${sub.submissionId}`)}
                      className="bg-[#1f1f1f] p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded ${sub.verdict === "PASS" ? "bg-[#6ee7b7]/10 text-[#6ee7b7]" :
                              sub.verdict === "FAIL" || sub.verdict === "COMPILATION_ERROR" || sub.verdict === "RUNTIME_ERROR" ? "bg-[#f87171]/10 text-[#f87171]" :
                                "bg-[#fbbf24]/10 text-[#fbbf24]"
                            }`}>
                            {sub.verdict || "PENDING"}
                          </span>
                          <span className="text-[10px] text-[#474747] uppercase">{sub.language}</span>
                        </div>
                        <span className="text-[10px] text-[#474747]">
                          {new Date(sub.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#919191]">
                        {sub.executionTime && <span>Time: {sub.executionTime}</span>}
                        {sub.totalPassed && <span>Passed: {sub.totalPassed}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "discuss" && (
            <div className="px-8 py-8 h-full flex flex-col">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tighter text-white mb-6">
                Discussion
              </h2>

              {/* Create Discussion */}
              <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 mb-8">
                <textarea
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  className="w-full bg-[#131313] text-white border border-[#2a2a2a] p-3 min-h-[100px] focus:outline-none focus:border-[#6ee7b7] transition-colors resize-none text-sm mb-3"
                  placeholder="Ask a question or share a hint..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateDiscussion}
                    disabled={!newDiscussion.trim()}
                    className="px-6 py-2 bg-white text-black text-xs tracking-widest uppercase font-bold hover:bg-[#e0e0e0] transition-colors disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Discussions List */}
              <div className="space-y-4 flex-1 overflow-y-auto pb-4 pr-2">
                {discussions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#474747] text-sm">No discussions yet. Be the first to start one!</p>
                  </div>
                ) : (
                  <>
                    {discussions.map(disc => (
                      <div key={disc.id} className="border-b border-[#2a2a2a] pb-6 last:border-0">
                        <div
                          className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/profile/${disc.userId}`)}
                        >
                          <div className="w-8 h-8 bg-[#2a2a2a] overflow-hidden rounded-full border border-[#474747] flex-shrink-0">
                            <img src={`/src/assets/pfp/${disc.userProfilePicture || 0}.png`} alt="☣" className="w-full h-full object-cover grayscale" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold leading-none hover:underline">{disc.userName}</p>
                            <p className="text-[#474747] text-[10px] uppercase tracking-widest mt-1">
                              {disc.timestamp ? new Date(disc.timestamp).toLocaleString() : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-[#c6c6c6] text-sm leading-relaxed pl-11 whitespace-pre-wrap">{disc.content}</p>
                      </div>
                    ))}
                    {hasMoreDiscussions && (
                      <button
                        onClick={() => {
                          const nextPage = discussionsPage + 1;
                          setDiscussionsPage(nextPage);
                          fetchDiscussions(nextPage);
                        }}
                        className="w-full py-3 mt-4 bg-[#1f1f1f] text-white text-xs tracking-widest uppercase font-bold hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a]"
                      >
                        Load More
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Pane: Code Editor */}
        <section className="flex-1 bg-[#0e0e0e] flex flex-col">
          {/* Editor Header */}
          <div className="h-12 bg-[#1f1f1f] flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-[#2a2a2a] text-white text-xs tracking-widest uppercase font-bold px-4 py-2 appearance-none cursor-pointer hover:bg-[#353535] transition-colors"
                >
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <option key={key} value={key}>{lang.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#474747] text-sm pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#474747] tracking-widest uppercase">
                {code.split('\n').length} lines
              </span>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: "on",
                renderWhitespace: "selection",
                tabSize: 4,
                insertSpaces: true,
                bracketPairColorization: { enabled: true },
                wordWrap: "on"
              }}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-[#f87171]/10 border-t border-[#f87171]/30 p-3 text-sm text-[#f87171]">
              <span className="material-symbols-outlined text-sm align-middle mr-2">error</span>
              {error}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Bar */}
      <footer className="h-16 bg-[#1F1F1F] border-t border-white/10 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-[#919191] hover:text-white transition-colors text-xs tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm">keyboard_command_key</span>
            Shortcuts
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-[#474747] text-[10px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm">cloud_done</span>
            Auto-saved
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRun}
            disabled={submitting}
            className="px-8 h-10 bg-[#2a2a2a] text-white text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-[#353535] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Code
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 h-10 bg-white text-black text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-[#e0e0e0] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                SUBMITTING...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}