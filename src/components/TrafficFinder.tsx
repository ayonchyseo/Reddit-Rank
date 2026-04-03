import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";
import type { RedditPost } from "../types/reddit";

interface TrafficData {
  linkFriendlySubreddits: {
    subreddit: string;
    linkAllowedScore: number;
    evidence: string;
    trafficPotential: string;
    subscribers: number;
    strategy: string;
  }[];
  viralPatterns: {
    pattern: string;
    description: string;
    example: string;
  }[];
  trafficStrategy: string;
  bestPostingTimes: string;
  risksToAvoid: string[];
}

export function TrafficFinder() {
  const [keyword, setKeyword] = useState("");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [insights, setInsights] = useState<TrafficData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;

    setPosts([]);
    setInsights(null);
    setIsAnalyzing(true);

    try {
      const res = await execute(
        fetchReddit("search", {
          q: keyword,
          sort: "top",
          limit: "50",
          t: "month",
        }),
      );
      if (!res) return;

      const fetchedPosts =
        (res.data?.children?.map((c: any) => c.data) as RedditPost[]) || [];

      // Filter posts that have external links (not self posts, not reddit media)
      const postsWithLinks = fetchedPosts.filter(
        (p) =>
          !p.is_video &&
          !p.url.includes("reddit.com") &&
          !p.url.includes("redd.it"),
      );

      setPosts(postsWithLinks);

      const linkDataForAi = postsWithLinks
        .map(
          (p) =>
            `[r/${p.subreddit}] [${p.ups} ups] ${p.title} (Link: ${p.url})`,
        )
        .join("\n");
      const allDataForAi = fetchedPosts
        .slice(0, 20)
        .map((p) => `[r/${p.subreddit}] ${p.title}`)
        .join("\n");

      const prompt = `
You are a Reddit traffic growth expert.

KEYWORD: ${keyword}
TOP REDDIT POSTS WITH LINKS:
${linkDataForAi}
ALL TOP POSTS:
${allDataForAi}

Return JSON:
{
  "linkFriendlySubreddits": [
    {
      "subreddit": "r/example",
      "linkAllowedScore": 85,
      "evidence": "X out of Y top posts have external links",
      "trafficPotential": "high | medium | low",
      "subscribers": 100000,
      "strategy": "How to post links here without getting banned"
    }
  ],
  "viralPatterns": [
    {
      "pattern": "Pattern name",
      "description": "What makes posts go viral here",
      "example": "Example post title"
    }
  ],
  "trafficStrategy": "Overall strategy to drive Reddit traffic to your site",
  "bestPostingTimes": "When to post for maximum visibility",
  "risksToAvoid": ["risk1", "risk2", "risk3"]
}
Return ONLY valid JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<TrafficData>(aiResult);
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
        <h2 className="text-3xl font-bold text-gray-100 mb-2">
          Traffic Finder
        </h2>
        <p className="text-gray-400">
          Find subreddits that allow external links and learn how to drive
          traffic without getting banned.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter your niche keyword (e.g., 'web development')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !keyword.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading || isAnalyzing ? "Scanning..." : "Find Traffic Sources"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Analyzing link policies and traffic potential..." />
      )}

      {insights && (
        <>
          <AIInsightBox title="Traffic Strategy">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  Overall Strategy
                </h4>
                <p className="mb-4">{insights.trafficStrategy}</p>

                <h4 className="font-semibold text-gray-300 mb-2">
                  Best Posting Times
                </h4>
                <p>{insights.bestPostingTimes}</p>
              </div>
              <div>
                <h4 className="font-semibold text-red-400 mb-2">
                  Risks to Avoid
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.risksToAvoid.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AIInsightBox>

          <ResultCard title="Link-Friendly Subreddits">
            <div className="space-y-4">
              {insights.linkFriendlySubreddits.map((sub, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-200 text-lg">
                        {sub.subreddit}
                      </h4>
                      <p className="text-xs text-gray-500">{sub.evidence}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-400 mb-1">
                        Link Allowed Score
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${sub.linkAllowedScore > 70 ? "bg-emerald-500" : sub.linkAllowedScore > 40 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${sub.linkAllowedScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-200">
                          {sub.linkAllowedScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500 block mb-1">
                        Traffic Potential
                      </span>
                      <span className="capitalize text-gray-200">
                        {sub.trafficPotential}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">
                        Posting Strategy
                      </span>
                      <span className="text-gray-300">{sub.strategy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResultCard title="Viral Link Patterns">
              <div className="space-y-4">
                {insights.viralPatterns.map((pattern, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
                  >
                    <h4 className="font-medium text-reddit mb-2">
                      {pattern.pattern}
                    </h4>
                    <p className="text-sm text-gray-300 mb-2">
                      {pattern.description}
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      Example: "{pattern.example}"
                    </p>
                  </div>
                ))}
              </div>
            </ResultCard>

            <ResultCard title="Proof: Top Posts with Links">
              <div className="space-y-3">
                {posts.slice(0, 5).map((post, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-800/30 border border-gray-800 rounded-lg text-sm"
                  >
                    <a
                      href={`https://reddit.com${post.permalink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-gray-200 hover:text-reddit block mb-1"
                    >
                      {post.title}
                    </a>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">
                        r/{post.subreddit} • ↑ {post.ups}
                      </span>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline truncate max-w-[150px]"
                      >
                        {new URL(post.url).hostname}
                      </a>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No external link posts found in top results.
                  </p>
                )}
              </div>
            </ResultCard>
          </div>
        </>
      )}
    </div>
  );
}
