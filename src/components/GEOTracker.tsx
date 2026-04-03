import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";
import type { RedditPost } from "../types/reddit";

interface GEOData {
  aiVisibilityScore: number;
  scoreReason: string;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topMentionContexts: string[];
  aiCitationRisk: string;
  aiCitationOpportunity: string;
  geoStrategy: string;
  recommendedActions: string[];
}

export function GEOTracker() {
  const [brand, setBrand] = useState("");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [insights, setInsights] = useState<GEOData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    if (!brand.trim()) return;

    setPosts([]);
    setInsights(null);
    setIsAnalyzing(true);

    try {
      const newRes = await execute(
        fetchReddit("search", { q: brand, sort: "new", limit: "50" }),
      );
      await new Promise((r) => setTimeout(r, 1000));
      const topRes = await execute(
        fetchReddit("search", { q: brand, sort: "top", limit: "25" }),
      );

      if (!newRes || !topRes) return;

      const fetchedNew = newRes.data?.children?.map((c: any) => c.data) || [];
      const fetchedTop = topRes.data?.children?.map((c: any) => c.data) || [];

      // Combine and deduplicate
      const allPosts = [...fetchedNew, ...fetchedTop];
      const uniquePosts = Array.from(
        new Map(allPosts.map((p) => [p.id, p])).values(),
      ) as RedditPost[];

      setPosts(uniquePosts.slice(0, 50));

      const postDataForAi = uniquePosts
        .slice(0, 30)
        .map((p: any) => `[r/${p.subreddit}] ${p.title}`)
        .join("\n");

      const prompt = `
You are a GEO (Generative Engine Optimization) analyst. Analyze these Reddit 
mentions of "${brand}":

POSTS AND COMMENTS:
${postDataForAi}

Return JSON:
{
  "aiVisibilityScore": 72,
  "scoreReason": "Why this score",
  "sentimentBreakdown": {
    "positive": 60,
    "neutral": 25,
    "negative": 15
  },
  "topMentionContexts": ["context1", "context2", "context3"],
  "aiCitationRisk": "What negative content might AI systems pick up",
  "aiCitationOpportunity": "What positive content should be amplified",
  "geoStrategy": "3-5 sentence strategy to improve AI citation visibility",
  "recommendedActions": ["action1", "action2", "action3"]
}
Return ONLY valid JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<GEOData>(aiResult);
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
        <h2 className="text-3xl font-bold text-gray-100 mb-2">GEO Tracker</h2>
        <p className="text-gray-400">
          Track brand mentions to optimize for Generative Engine Optimization
          (AI citations).
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Enter a brand name or keyword (e.g., 'Notion')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !brand.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading || isAnalyzing ? "Analyzing..." : "Track Brand"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Scanning Reddit for brand mentions..." />
      )}

      {insights && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResultCard title="AI Visibility Score" className="md:col-span-1">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-5xl font-bold text-reddit mb-2">
                  {insights.aiVisibilityScore}
                </span>
                <span className="text-sm text-gray-400 text-center">
                  {insights.scoreReason}
                </span>
              </div>
            </ResultCard>
            <ResultCard title="Sentiment Breakdown" className="md:col-span-3">
              <div className="flex h-8 rounded-full overflow-hidden mb-4">
                <div
                  style={{ width: `${insights.sentimentBreakdown.positive}%` }}
                  className="bg-emerald-500"
                  title="Positive"
                ></div>
                <div
                  style={{ width: `${insights.sentimentBreakdown.neutral}%` }}
                  className="bg-gray-500"
                  title="Neutral"
                ></div>
                <div
                  style={{ width: `${insights.sentimentBreakdown.negative}%` }}
                  className="bg-red-500"
                  title="Negative"
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">
                  Positive: {insights.sentimentBreakdown.positive}%
                </span>
                <span className="text-gray-400">
                  Neutral: {insights.sentimentBreakdown.neutral}%
                </span>
                <span className="text-red-400">
                  Negative: {insights.sentimentBreakdown.negative}%
                </span>
              </div>
            </ResultCard>
          </div>

          <AIInsightBox title="GEO Strategy & Risks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  AI Citation Opportunity
                </h4>
                <p className="mb-4 text-emerald-400">
                  {insights.aiCitationOpportunity}
                </p>

                <h4 className="font-semibold text-gray-300 mb-2">
                  AI Citation Risk
                </h4>
                <p className="mb-4 text-red-400">{insights.aiCitationRisk}</p>

                <h4 className="font-semibold text-gray-300 mb-2">
                  Top Mention Contexts
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.topMentionContexts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  GEO Strategy
                </h4>
                <p className="mb-4">{insights.geoStrategy}</p>

                <h4 className="font-semibold text-gray-300 mb-2">
                  Recommended Actions
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.recommendedActions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AIInsightBox>
        </>
      )}

      {posts.length > 0 && (
        <ResultCard title="Recent Mentions Timeline">
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <a
                    href={`https://reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-gray-200 hover:text-reddit"
                  >
                    {post.title}
                  </a>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {new Date(post.created_utc * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-gray-800 rounded">
                    r/{post.subreddit}
                  </span>
                  <span>↑ {post.ups}</span>
                  <span>💬 {post.num_comments}</span>
                </div>
              </div>
            ))}
          </div>
        </ResultCard>
      )}
    </div>
  );
}
