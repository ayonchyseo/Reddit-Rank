import { useState } from "react";
import { Target } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";

interface AEOData {
  citationWorthyPosts: {
    title: string;
    citationScore: number;
    reasons: string[];
    improvementTips: string;
  }[];
  answerGaps: string[];
  idealAnswerStructure: string;
  draftAnswer: string;
  targetSubreddits: string[];
}

export function AEOFinder() {
  const [topic, setTopic] = useState("");
  const [insights, setInsights] = useState<AEOData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    if (!topic.trim()) return;

    setInsights(null);
    setIsAnalyzing(true);

    try {
      const res = await execute(
        fetchReddit("search", {
          q: topic,
          sort: "top",
          limit: "25",
          type: "comment",
        }),
      );
      if (!res) return;

      const fetchedComments = res.data?.children?.map((c: any) => c.data) || [];
      const commentData = fetchedComments
        .slice(0, 20)
        .map((c: any) => `[${c.ups} upvotes] ${c.body}`)
        .join("\n\n");

      const prompt = `
You are an AEO (Answer Engine Optimization) expert. AI systems like ChatGPT, 
Perplexity, and Google AI Overviews frequently cite Reddit content.

TOPIC: ${topic}
REDDIT DATA: 
${commentData}

Return JSON:
{
  "citationWorthyPosts": [
    {
      "title": "post title or comment snippet",
      "citationScore": 85,
      "reasons": ["specific", "high upvotes", "factual"],
      "improvementTips": "How to make similar content even more citable"
    }
  ],
  "answerGaps": ["unanswered question 1", "unanswered question 2"],
  "idealAnswerStructure": "How to structure a Reddit comment to get cited by AI",
  "draftAnswer": "Write a 150-200 word Reddit comment that would be highly cited by AI for this topic. Make it factual, specific, and helpful.",
  "targetSubreddits": ["sub1", "sub2"]
}
Return ONLY valid JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<AEOData>(aiResult);
      if (parsed) setInsights(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-2">AEO Finder</h2>
        <p className="text-gray-400">
          Find and create Reddit content that AI engines (ChatGPT, Perplexity)
          will cite.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a question or topic (e.g., 'how to fix leaky faucet')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !topic.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading || isAnalyzing ? "Analyzing..." : "Find AEO Targets"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Analyzing Reddit for AI citation opportunities..." />
      )}

      {insights && (
        <>
          <AIInsightBox title="AEO Strategy & Draft">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  Answer Gaps (Opportunities)
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.answerGaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  Ideal Answer Structure
                </h4>
                <p>{insights.idealAnswerStructure}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  AI-Optimized Draft Answer
                </h4>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-gray-300 whitespace-pre-wrap">
                  {insights.draftAnswer}
                </div>
              </div>
            </div>
          </AIInsightBox>

          <ResultCard title="Currently Cited / Citation-Worthy Content">
            <div className="space-y-4">
              {insights.citationWorthyPosts.map((post, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-200">{post.title}</h4>
                    <span className="px-2 py-1 bg-reddit/20 text-reddit text-xs font-bold rounded">
                      Score: {post.citationScore}/100
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Why it works:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {post.reasons.map((r, j) => (
                        <span
                          key={j}
                          className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-3">
                    <span className="text-gray-300 font-medium">
                      Improvement Tip:
                    </span>{" "}
                    {post.improvementTips}
                  </p>
                </div>
              ))}
            </div>
          </ResultCard>
        </>
      )}
    </div>
  );
}
