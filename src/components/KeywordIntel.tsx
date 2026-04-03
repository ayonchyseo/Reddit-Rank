import { useState } from "react";
import { Search } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";
import { ExportButton } from "./shared/ExportButton";
import type { RedditPost } from "../types/reddit";

interface KeywordIntelData {
  userIntent: string;
  painPoints: string[];
  contentGaps: string[];
  seoOpportunity: string;
  searchIntent: string;
  topSubreddits: string[];
  recommendedAngles: string[];
}

export function KeywordIntel() {
  const [keyword, setKeyword] = useState("");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [insights, setInsights] = useState<KeywordIntelData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;

    setPosts([]);
    setInsights(null);
    setIsAnalyzing(true);

    try {
      // Fetch posts (links and comments)
      const linkRes = await execute(
        fetchReddit("search", {
          q: keyword,
          sort: "top",
          limit: "25",
          type: "link",
        }),
      );

      // Delay to avoid rate limit
      await new Promise((r) => setTimeout(r, 1000));

      const commentRes = await execute(
        fetchReddit("search", {
          q: keyword,
          sort: "top",
          limit: "25",
          type: "comment",
        }),
      );

      if (!linkRes || !commentRes) return;

      const fetchedPosts =
        linkRes.data?.children?.map((c: any) => c.data) || [];
      const fetchedComments =
        commentRes.data?.children?.map((c: any) => c.data) || [];

      setPosts(fetchedPosts.slice(0, 10));

      const postTitles = fetchedPosts
        .slice(0, 10)
        .map((p: any) => p.title)
        .join("\n");
      const comments = fetchedComments
        .slice(0, 20)
        .map((c: any) => c.body)
        .join("\n");

      const prompt = `
You are an SEO analyst. Analyze these Reddit posts and comments about "${keyword}":

POSTS:
${postTitles}

TOP COMMENTS:
${comments}

Return a JSON object with these exact keys:
{
  "userIntent": "2-3 sentence summary of what users actually want",
  "painPoints": ["pain1", "pain2", "pain3", "pain4", "pain5"],
  "contentGaps": ["gap1", "gap2", "gap3"],
  "seoOpportunity": "2-3 sentence SEO opportunity summary",
  "searchIntent": "informational | navigational | transactional | commercial",
  "topSubreddits": ["sub1", "sub2", "sub3"],
  "recommendedAngles": ["angle1", "angle2", "angle3"]
}
Return ONLY valid JSON. No markdown. No explanation.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<KeywordIntelData>(aiResult);
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
        <h2 className="text-3xl font-bold text-gray-100 mb-2">Keyword Intel</h2>
        <p className="text-gray-400">
          Discover real user intent and pain points behind any keyword.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword (e.g., 'best running shoes')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !keyword.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading || isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Fetching Reddit data and analyzing with Gemini..." />
      )}

      {insights && (
        <AIInsightBox title="AI Keyword Intelligence">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">User Intent</h4>
              <p className="mb-4">{insights.userIntent}</p>

              <h4 className="font-semibold text-gray-300 mb-2">
                Search Intent
              </h4>
              <p className="mb-4 capitalize bg-gray-800 inline-block px-3 py-1 rounded text-reddit">
                {insights.searchIntent}
              </p>

              <h4 className="font-semibold text-gray-300 mb-2">
                SEO Opportunity
              </h4>
              <p>{insights.seoOpportunity}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">
                Common Pain Points
              </h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {insights.painPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>

              <h4 className="font-semibold text-gray-300 mb-2">Content Gaps</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {insights.contentGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>

              <h4 className="font-semibold text-gray-300 mb-2">
                Recommended Angles
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {insights.recommendedAngles.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </AIInsightBox>
      )}

      {posts.length > 0 && (
        <ResultCard title="Top Reddit Posts">
          <div className="flex justify-end mb-4">
            <ExportButton
              data={posts}
              filename={`${keyword}-reddit-posts.csv`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Title</th>
                  <th className="px-4 py-3">Subreddit</th>
                  <th className="px-4 py-3">Upvotes</th>
                  <th className="px-4 py-3 rounded-tr-lg">Comments</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-200">
                      <a
                        href={`https://reddit.com${post.permalink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-reddit transition-colors"
                      >
                        {post.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      r/{post.subreddit}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{post.ups}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {post.num_comments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
