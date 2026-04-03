import { useState } from "react";
import { Crosshair } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";
import type { RedditPost } from "../types/reddit";

interface CompetitorData {
  trafficSourceSubreddits: {
    subreddit: string;
    estimatedTrafficPotential: string;
    sentiment: string;
    opportunityScore: number;
  }[];
  competitorStrengths: string[];
  competitorWeaknesses: string[];
  yourOpportunities: {
    subreddit: string;
    strategy: string;
    contentAngle: string;
  }[];
  quickWins: string[];
  summary: string;
}

export function CompetitorSpy() {
  const [domain, setDomain] = useState("");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [insights, setInsights] = useState<CompetitorData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    if (!domain.trim()) return;

    setPosts([]);
    setInsights(null);
    setIsAnalyzing(true);

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const urlRes = await execute(
        fetchReddit("search", {
          q: `url:${cleanDomain}`,
          sort: "top",
          limit: "25",
        }),
      );
      await new Promise((r) => setTimeout(r, 1000));
      const textRes = await execute(
        fetchReddit("search", { q: cleanDomain, sort: "top", limit: "25" }),
      );

      if (!urlRes || !textRes) return;

      const fetchedUrl = urlRes.data?.children?.map((c: any) => c.data) || [];
      const fetchedText = textRes.data?.children?.map((c: any) => c.data) || [];

      const allPosts = [...fetchedUrl, ...fetchedText];
      const uniquePosts = Array.from(
        new Map(allPosts.map((p) => [p.id, p])).values(),
      ) as RedditPost[];

      setPosts(uniquePosts);

      const postDataForAi = uniquePosts
        .slice(0, 30)
        .map((p: any) => `[r/${p.subreddit}] ${p.title}`)
        .join("\n");

      const prompt = `
You are a competitive SEO analyst. Analyze these Reddit mentions of competitor 
domain "${cleanDomain}":

DATA:
${postDataForAi}

Return JSON:
{
  "trafficSourceSubreddits": [
    {
      "subreddit": "r/example",
      "estimatedTrafficPotential": "high | medium | low",
      "sentiment": "positive | negative | neutral",
      "opportunityScore": 85
    }
  ],
  "competitorStrengths": ["strength1", "strength2"],
  "competitorWeaknesses": ["weakness1", "weakness2"],
  "yourOpportunities": [
    {
      "subreddit": "r/example",
      "strategy": "How to take traffic from this subreddit",
      "contentAngle": "What content to create"
    }
  ],
  "quickWins": ["win1", "win2", "win3"],
  "summary": "Overall competitive analysis summary"
}
Return ONLY valid JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<CompetitorData>(aiResult);
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
          Competitor Spy
        </h2>
        <p className="text-gray-400">
          Find out where your competitors are getting Reddit traffic and steal
          their strategy.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter competitor domain (e.g., 'stripe.com')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !domain.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading || isAnalyzing ? "Spying..." : "Spy on Competitor"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Gathering competitor intelligence..." />
      )}

      {insights && (
        <>
          <AIInsightBox title="Competitive Summary">
            <p className="mb-6">{insights.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-emerald-400 mb-2">
                  Competitor Strengths
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.competitorStrengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-400 mb-2">
                  Competitor Weaknesses
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.competitorWeaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-reddit mb-2">Quick Wins</h4>
              <ul className="list-disc pl-5 space-y-1">
                {insights.quickWins.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </AIInsightBox>

          <ResultCard title="Traffic Source Subreddits">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Subreddit</th>
                    <th className="px-4 py-3">Traffic Potential</th>
                    <th className="px-4 py-3">Sentiment</th>
                    <th className="px-4 py-3 rounded-tr-lg">
                      Opportunity Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.trafficSourceSubreddits.map((sub, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3 font-medium text-gray-200">
                        {sub.subreddit}
                      </td>
                      <td className="px-4 py-3 text-gray-400 capitalize">
                        {sub.estimatedTrafficPotential}
                      </td>
                      <td className="px-4 py-3 text-gray-400 capitalize">
                        {sub.sentiment}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-800 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-reddit h-2 rounded-full"
                              style={{ width: `${sub.opportunityScore}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400">
                            {sub.opportunityScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultCard>

          <ResultCard title="Your Opportunities">
            <div className="space-y-4">
              {insights.yourOpportunities.map((opp, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
                >
                  <h4 className="font-medium text-gray-200 mb-2">
                    {opp.subreddit}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">
                    <strong className="text-gray-300">Strategy:</strong>{" "}
                    {opp.strategy}
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong className="text-gray-300">Content Angle:</strong>{" "}
                    {opp.contentAngle}
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
