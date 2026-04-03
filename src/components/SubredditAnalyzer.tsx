import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";
import { ExportButton } from "./shared/ExportButton";
import type { RedditPost, SubredditAbout } from "../types/reddit";

interface SubredditAnalysisData {
  titleFormula: string;
  bestPostTypes: string[];
  bestFlairs: string[];
  peakEngagementPattern: string;
  contentFormats: string[];
  audienceProfile: string;
  seoLinkOpportunity: string;
  postingStrategy: string;
}

export function SubredditAnalyzer() {
  const [subreddit, setSubreddit] = useState("");
  const [about, setAbout] = useState<SubredditAbout | null>(null);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [insights, setInsights] = useState<SubredditAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    const cleanSub = subreddit.replace(/^r\//, "").trim();
    if (!cleanSub) return;

    setAbout(null);
    setPosts([]);
    setInsights(null);
    setIsAnalyzing(true);

    try {
      const aboutRes = await execute(fetchReddit(`r/${cleanSub}/about`));
      if (aboutRes?.data) setAbout(aboutRes.data);

      await new Promise((r) => setTimeout(r, 1000));

      const topRes = await execute(
        fetchReddit(`r/${cleanSub}/top`, { t: "month", limit: "25" }),
      );
      if (!topRes) return;

      const fetchedPosts = topRes.data?.children?.map((c: any) => c.data) || [];
      setPosts(fetchedPosts);

      const postDataForAi = fetchedPosts
        .map((p: any) => `[${p.ups} upvotes] ${p.title}`)
        .join("\n");

      const prompt = `
You are an SEO and content strategist. Analyze this subreddit data for r/${cleanSub}:

TOP POSTS THIS MONTH:
${postDataForAi}

Return JSON:
{
  "titleFormula": "The winning title pattern for this subreddit",
  "bestPostTypes": ["type1", "type2"],
  "bestFlairs": ["flair1", "flair2"],
  "peakEngagementPattern": "When and what type of posts get most engagement",
  "contentFormats": ["format1", "format2", "format3"],
  "audienceProfile": "Who is the audience of this subreddit",
  "seoLinkOpportunity": "Can you post external links here? Strategy?",
  "postingStrategy": "3-5 sentence strategy for this subreddit"
}
Return ONLY valid JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<SubredditAnalysisData>(aiResult);
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
          Subreddit Analyzer
        </h2>
        <p className="text-gray-400">
          Decode the exact content formats and rules that win in any subreddit.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            placeholder="Enter a subreddit (e.g., 'SEO' or 'r/marketing')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !subreddit.trim()}
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
        <LoadingSpinner text="Fetching subreddit data and analyzing..." />
      )}

      {about && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard title="Subscribers">
            <p className="text-3xl font-bold text-gray-100">
              {(about.subscribers ?? 0).toLocaleString()}
            </p>
          </ResultCard>
          <ResultCard title="Active Users">
            <p className="text-3xl font-bold text-gray-100">
              {(about.active_user_count ?? 0).toLocaleString()}
            </p>
          </ResultCard>
          <ResultCard title="Created">
            <p className="text-3xl font-bold text-gray-100">
              {about.created_utc
                ? new Date(about.created_utc * 1000).toLocaleDateString()
                : "N/A"}
            </p>
          </ResultCard>
        </div>
      )}

      {insights && (
        <AIInsightBox title="Subreddit Strategy Insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">
                Audience Profile
              </h4>
              <p className="mb-4">{insights.audienceProfile}</p>

              <h4 className="font-semibold text-gray-300 mb-2">
                Title Formula
              </h4>
              <p className="mb-4 text-reddit font-medium">
                {insights.titleFormula}
              </p>

              <h4 className="font-semibold text-gray-300 mb-2">
                Posting Strategy
              </h4>
              <p>{insights.postingStrategy}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">
                Best Post Types
              </h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {insights.bestPostTypes.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <h4 className="font-semibold text-gray-300 mb-2">
                Content Formats
              </h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {insights.contentFormats.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>

              <h4 className="font-semibold text-gray-300 mb-2">
                SEO Link Opportunity
              </h4>
              <p>{insights.seoLinkOpportunity}</p>
            </div>
          </div>
        </AIInsightBox>
      )}

      {posts.length > 0 && (
        <ResultCard title="Top Posts This Month">
          <div className="flex justify-end mb-4">
            <ExportButton
              data={posts}
              filename={`${subreddit}-top-posts.csv`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Title</th>
                  <th className="px-4 py-3">Flair</th>
                  <th className="px-4 py-3">Upvotes</th>
                  <th className="px-4 py-3">Ratio</th>
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
                      {post.link_flair_text ? (
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                          {post.link_flair_text}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{post.ups}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {Math.round(post.upvote_ratio * 100)}%
                    </td>
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
