import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";

export default function SubmissionResult() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [approach, setApproach] = useState("");
  const [sharing, setSharing] = useState(false);
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSubmissionData();
  }, [submissionId]);

  const fetchSubmissionData = async () => {
    try {
      // First fetch submission
      const submissionRes = await fetch(`/api/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!submissionRes.ok) throw new Error("Failed to fetch submission");
      const submissionData = await submissionRes.json();
      setSubmission(submissionData);
      
      // Then fetch question to get execution times distribution
      const questionRes = await fetch(`/api/questions/${submissionData.questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (questionRes.ok) {
        const questionData = await questionRes.json();
        setQuestion(questionData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (submission?.userCode) {
      await navigator.clipboard.writeText(submission.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!approach.trim()) return;
    setSharing(true);
    try {
      const payload = {
        language: submission.language,
        code: submission.userCode,
        userId: parseInt(localStorage.getItem("userId") || "1"),
        userName: JSON.parse(localStorage.getItem("user") || "{}").username || "Developer",
        questionId: submission.questionId,
        executionTime: parseInt(submission.executionTime || "0"),
        aproach: approach,
        timeComplexity: submission.timeComplexity || "N/A",
        spaceComplexity: submission.spaceComplexity || "N/A",
      };

      const res = await fetch("/api/solutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to share");
      setShowShareModal(false);
      alert("Solution shared successfully!");
    } catch(err) {
      alert("Error sharing solution: " + err.message);
    } finally {
      setSharing(false);
    }
  };

  const getVerdictColor = (verdict) => {
    if (verdict === "PASS") return "text-[#6ee7b7]";
    if (verdict === "COMPILATION_ERROR" || verdict === "RUNTIME_ERROR" || verdict === "FAIL") return "text-[#f87171]";
    if (verdict === "TIME_LIMIT_EXCEEDED") return "text-[#fbbf24]";
    return "text-[#474747]";
  };

  const getVerdictIcon = (verdict) => {
    if (verdict === "PASS") return "check_circle";
    if (verdict === "FAIL" || verdict === "COMPILATION_ERROR" || verdict === "RUNTIME_ERROR") return "cancel";
    if (verdict === "TIME_LIMIT_EXCEEDED") return "schedule";
    return "pending";
  };

  const getVerdictBg = (verdict) => {
    if (verdict === "PASS") return "bg-[#6ee7b7]";
    if (verdict === "COMPILATION_ERROR" || verdict === "RUNTIME_ERROR" || verdict === "FAIL") return "bg-[#f87171]";
    if (verdict === "TIME_LIMIT_EXCEEDED") return "bg-[#fbbf24]";
    return "bg-[#474747]";
  };

  // Calculate percentile based on execution times distribution
  const calculatePercentile = (executionTime, executionTimesMap) => {
    if (!executionTimesMap || Object.keys(executionTimesMap).length === 0) return null;
    
    let totalSubmissions = 0;
    let slowerSubmissions = 0;
    
    Object.entries(executionTimesMap).forEach(([timeStr, count]) => {
      const time = parseInt(timeStr);
      totalSubmissions += count;
      if (time >= executionTime) {
        slowerSubmissions += count;
      }
    });

    if (totalSubmissions === 0) return null;
    return ((slowerSubmissions / totalSubmissions) * 100).toFixed(1);
  };

  // Generate histogram data for execution times (top 10 distinct execution times)
  const generateHistogramData = (executionTimesMap, currentTime) => {
    if (!executionTimesMap || Object.keys(executionTimesMap).length === 0) return [];
    
    let timesAndCounts = Object.entries(executionTimesMap).map(([timeStr, count]) => ({
      time: parseInt(timeStr),
      count: parseInt(count)
    }));
    
    if (timesAndCounts.length === 0) return [];

    // Sort by execution time ascending (fastest first)
    timesAndCounts.sort((a, b) => a.time - b.time);
    
    // Take at most 10 distinct pillars
    timesAndCounts = timesAndCounts.slice(0, 10);
    
    const maxCount = Math.max(...timesAndCounts.map(tc => tc.count));
    if (maxCount === 0) return [];
    
    return timesAndCounts.map(({ time, count }) => ({
      range: `${time}ms`,
      count,
      height: (count / maxCount) * 100,
      isCurrent: currentTime === time
    }));
  };

  // Get language display name
  const getLanguageDisplay = (lang) => {
    const languages = {
      java: "Java",
      python: "Python 3",
      cpp: "C++"
    };
    return languages[lang] || lang?.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#474747] font-mono text-xs tracking-widest uppercase">LOADING RESULTS...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[#474747] mb-4">error</span>
          <p className="text-white mb-2">Failed to load submission</p>
          <p className="text-[#474747] text-sm mb-4">{error}</p>
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

  const executionTimesMap = question?.executionTimes;
  const percentile = submission.executionTime ? 
    calculatePercentile(parseInt(submission.executionTime), executionTimesMap) : null;
  const histogramData = executionTimesMap ? 
    generateHistogramData(executionTimesMap, parseInt(submission.executionTime || "0")) : [];

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#131313] flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-8">
          <span className="font-['Space_Grotesk'] uppercase tracking-widest text-xl font-black text-white">
            MONOLITH.IDE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white overflow-hidden">
            <img 
              alt="☣" 
              className="w-full h-full object-cover grayscale" 
              src={`/src/assets/pfp/${JSON.parse(localStorage.getItem("user") || "{}").profilePictureId || 0}.png`}
            />
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 border-b border-[#474747]/20 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#474747] mb-4">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <button 
                onClick={() => navigate(`/problems/${submission.questionId}`)}
                className="font-['Space_Grotesk'] text-xs tracking-[0.2em] uppercase hover:text-white transition-colors"
              >
                Back to Problem
              </button>
            </div>
            <h1 className="font-['Space_Grotesk'] text-5xl font-bold tracking-tighter uppercase">
              {submission.questionTitle || `Problem ${submission.questionId}`}
            </h1>
            <div className="flex gap-6 mt-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-[#474747]">Language</span>
                <span className="text-sm font-medium">{getLanguageDisplay(submission.language)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-[#474747]">Submitted At</span>
                <span className="text-sm font-medium">
                  {new Date(submission.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className={`${getVerdictBg(submission.verdict)}/10 border ${getVerdictBg(submission.verdict)}/30 px-8 py-4`}>
              <span className={`font-['Space_Grotesk'] text-4xl font-black tracking-tighter ${getVerdictColor(submission.verdict)}`}>
                {submission.verdict || "PENDING"}
              </span>
            </div>
            {submission.totalPassed && (
              <span className="text-xs tracking-widest text-[#474747]">
                PASSED {submission.totalPassed} TEST CASES
              </span>
            )}
          </div>
        </div>

        {/* Bento Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Performance Section */}
          <div className="lg:col-span-5 bg-[#1f1f1f] p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-['Space_Grotesk'] text-sm tracking-[0.3em] uppercase mb-8 text-[#474747]">
                Performance Metrics
              </h2>
              <div className="space-y-12">
                {/* Execution Time */}
                {submission.executionTime && (
                  <div>
                    <div className="flex justify-between items-baseline mb-4">
                      <span className="text-3xl font-light tracking-tighter">
                        {submission.executionTime}
                      </span>
                      {percentile && (
                        <span className="text-xs tracking-widest uppercase text-white">
                          Beats {percentile}%
                        </span>
                      )}
                    </div>
                    
                    {/* Distribution Histogram */}
                    {histogramData.length > 0 && (
                      <div className="space-y-3">
                        <div className="h-32 w-full flex items-end gap-2">
                          {histogramData.map((bin, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 transition-all duration-300 rounded-t-sm ${
                                bin.isCurrent 
                                  ? 'bg-[#6ee7b7]' 
                                  : 'bg-[#2a2a2a] hover:bg-[#353535]'
                              }`}
                              style={{ height: `${bin.height}%` }}
                              title={`${bin.range}: ${bin.count} submissions`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-[#353535] uppercase tracking-widest">
                          <span>Faster</span>
                          <span>Runtime Distribution</span>
                          <span>Slower</span>
                        </div>
                        <div className="text-[10px] text-[#474747] text-center">
                          Your submission: {submission.executionTime}
                        </div>
                      </div>
                    )}
                  </div>
                )}


              </div>
            </div>

            {/* Technical Analysis */}
            <div className="mt-12 pt-8 border-t border-[#474747]/10">
              <h3 className="font-['Space_Grotesk'] text-[10px] tracking-[0.3em] uppercase mb-4 text-[#474747]">
                Technical Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {submission.timeComplexity && (
                  <div className="p-4 bg-[#2a2a2a]">
                    <span className="block text-[10px] text-[#474747] uppercase mb-1">Time</span>
                    <span className="text-xl font-['Space_Grotesk'] font-bold text-white">
                      {submission.timeComplexity}
                    </span>
                  </div>
                )}
                {submission.spaceComplexity && (
                  <div className="p-4 bg-[#2a2a2a]">
                    <span className="block text-[10px] text-[#474747] uppercase mb-1">Space</span>
                    <span className="text-xl font-['Space_Grotesk'] font-bold text-white">
                      {submission.spaceComplexity}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-[#919191] leading-relaxed font-light">
                {submission.verdict === "PASS" 
                  ? "Solution passed all test cases with optimal performance metrics."
                  : "Solution requires optimization. Review the implementation for potential improvements."}
              </p>
            </div>
          </div>

          {/* Code Editor Section */}
          <div className="lg:col-span-7 bg-[#0e0e0e] flex flex-col">
            <div className="h-12 border-b border-[#474747]/10 flex items-center justify-between px-6 bg-[#1f1f1f]">
              <span className="font-['Space_Grotesk'] text-[10px] tracking-[0.2em] uppercase text-[#919191] flex items-center gap-2">
                <span className={`w-2 h-2 ${getVerdictBg(submission.verdict)}`} />
                source_code.{submission.language}
              </span>
              <button 
                onClick={copyToClipboard}
                className="hover:text-white text-[#474747] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
            <div className="h-[500px]">
              <Editor
                height="100%"
                language={submission.language || "java"}
                value={submission.userCode || ""}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  renderWhitespace: "selection",
                  wordWrap: "on"
                }}
              />
            </div>
            
            {/* Output Section */}
            {submission.output && (
              <div className="flex flex-col border-t border-[#474747]/10 bg-[#131313] min-h-[200px]">
                <div className="h-12 border-b border-[#474747]/10 flex items-center px-6 bg-[#1f1f1f]">
                  <span className="font-['Space_Grotesk'] text-[10px] tracking-[0.2em] uppercase text-[#919191] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">terminal</span>
                    Console Output
                  </span>
                </div>
                <div className="p-6 overflow-y-auto flex-grow font-mono text-xs text-[#d4d4d4] whitespace-pre-wrap leading-relaxed">
                  {submission.output}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(`/problems/${submission.questionId}`)}
            className="px-6 py-3 bg-[#2a2a2a] text-white text-xs tracking-widest uppercase font-bold hover:bg-[#353535] transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-white text-black text-xs tracking-widest uppercase font-bold hover:bg-[#e0e0e0] transition-colors"
          >
            Back to Problems
          </button>
          {submission.verdict === "PASS" && (
            <button
               onClick={() => setShowShareModal(true)}
               className="ml-auto px-6 py-3 bg-[#6ee7b7]/10 text-[#6ee7b7] border border-[#6ee7b7]/30 text-xs tracking-widest uppercase font-bold hover:bg-[#6ee7b7]/20 transition-colors"
            >
               Share Solution
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0e0e0e] flex flex-col md:flex-row justify-between items-center w-full px-12 py-8 mt-auto border-t border-[#474747]/10">
        <div className="font-['Inter'] text-[10px] tracking-[0.2em] font-light text-[#474747]">
          © 2024 MONOLITH. ALL RIGHTS RESERVED.
        </div>
      </footer>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-[#131313] border border-[#2a2a2a] p-8 max-w-lg w-full m-4">
            <h3 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tighter text-white mb-4">
              Share Your Solution
            </h3>
            <div className="mb-6">
              <label className="block text-[#474747] text-xs font-bold mb-2 uppercase tracking-widest">
                Approach & Explanation
              </label>
              <textarea
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                className="w-full bg-[#1f1f1f] text-white border border-[#2a2a2a] p-4 h-32 focus:outline-none focus:border-[#6ee7b7] transition-colors resize-none text-sm"
                placeholder="Explain how you solved this problem..."
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-2 text-[#919191] hover:text-white text-xs tracking-widest uppercase font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={sharing || !approach.trim()}
                className="px-6 py-2 bg-[#6ee7b7] text-black text-xs tracking-widest uppercase font-bold hover:bg-[#34d399] transition-colors disabled:opacity-50"
              >
                {sharing ? "Sharing..." : "Share Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}