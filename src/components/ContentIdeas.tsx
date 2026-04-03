import { useState } from "react";
import { Lightbulb, Copy, Check } from "lucide-react";
import { fetchReddit, useReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { ResultCard } from "./shared/ResultCard";
import { AIInsightBox } from "./shared/AIInsightBox";
import { LoadingSpinner } from "./shared/LoadingSpinner";

interface ContentIdeasData {
  postTitleIdeas: {
    title: string;
    format: string;
    predictedEngagement: string;
    bestSubreddit: string;
    bestTime: string;
    seoKeyword: string;
  }[];
  questionPostIdeas: {
    question: string;
    whyItWorks: string;
    bestSubreddit: string;
  }[];
  caseStudyOutlines: {
    title: string;
    hook: string;
    keyPoints: string[];
    cta: string;
  }[];
  contentCalendar: string;
}

export function ContentIdeas() {
  const [niche, setNiche] = useState("");
  const [insights, setInsights] = useState<ContentIdeasData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { loading, error, execute } = useReddit();

  const handleAnalyze = async () => {
    if (!niche.trim()) return;

    setInsights(null);
    setIsAnalyzing(true);

    try {
      const topRes = await execute(
        fetchReddit("search", { q: niche, sort: "top", limit: "50" }),
      );
      await new Promise((r) => setTimeout(r, 1000));
      const risingRes = await execute(
        fetchReddit("search", { q: niche, sort: "rising", limit: "25" }),
      );

      if (!topRes || !risingRes) return;

      const topPosts =
        topRes.data?.children
          ?.map((c: any) => `[${c.data.ups} ups] ${c.data.title}`)
          .join("\n") || "";
      const risingPosts =
        risingRes.data?.children?.map((c: any) => c.data.title).join("\n") ||
        "";

      const prompt = `
You are a viral content strategist for Reddit and SEO expert.

NICHE: ${niche}
TOP REDDIT POSTS IN THIS NICHE:
${topPosts}
RISING POSTS:
${risingPosts}

Analyze the patterns and generate:
Return JSON:
{
  "postTitleIdeas": [
    {
      "title": "post title",
      "format": "how-to | list | question | case-study | story",
      "predictedEngagement": "high | medium | low",
      "bestSubreddit": "r/example",
      "bestTime": "Weekday mornings",
      "seoKeyword": "target keyword for this post"
    }
  ],
  "questionPostIdeas": [
    {
      "question": "Question text",
      "whyItWorks": "reason",
      "bestSubreddit": "r/example"
    }
  ],
  "caseStudyOutlines": [
    {
      "title": "Case study title",
      "hook": "Opening hook",
      "keyPoints": ["point1", "point2", "point3"],
      "cta": "Call to action"
    }
  ],
  "contentCalendar": "Suggested posting schedule for maximum impact"
}
Return ONLY valid JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<ContentIdeasData>(aiResult);
      if (parsed) setInsights(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-2">
          Content Ideas Generator
        </h2>
        <p className="text-gray-400">
          Generate viral post titles, questions, and case studies based on
          what's trending.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Lightbulb className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Enter a niche or topic (e.g., 'SaaS marketing')"
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || isAnalyzing || !niche.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading || isAnalyzing ? "Generating..." : "Generate Ideas"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Analyzing trends and generating content ideas..." />
      )}

      {insights && (
        <>
          <AIInsightBox title="Content Strategy & Calendar">
            <p className="whitespace-pre-wrap">{insights.contentCalendar}</p>
          </AIInsightBox>

          <ResultCard title="Viral Post Title Ideas">
            <div className="space-y-4">
              {insights.postTitleIdeas.map((idea, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg flex justify-between items-start group"
                >
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-200 text-lg mb-2">
                      {idea.title}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-800 rounded text-gray-400">
                        Format: {idea.format}
                      </span>
                      <span className="px-2 py-1 bg-gray-800 rounded text-gray-400">
                        {idea.bestSubreddit}
                      </span>
                      <span className="px-2 py-1 bg-gray-800 rounded text-gray-400">
                        SEO: {idea.seoKeyword}
                      </span>
                      <span
                        className={`px-2 py-1 rounded font-medium ${
                          idea.predictedEngagement === "high"
                            ? "bg-emerald-900/30 text-emerald-400"
                            : idea.predictedEngagement === "medium"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {idea.predictedEngagement} engagement
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(idea.title)}
                    className="p-2 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
                    title="Copy title"
                  >
                    {copiedText === idea.title ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </ResultCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResultCard title="Question Post Ideas">
              <div className="space-y-4">
                {insights.questionPostIdeas.map((idea, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-200">
                        {idea.question}
                      </h4>
                      <button
                        onClick={() => copyToClipboard(idea.question)}
                        className="text-gray-500 hover:text-gray-200 ml-2"
                      >
                        {copiedText === idea.question ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {idea.whyItWorks}
                    </p>
                    <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
                      {idea.bestSubreddit}
                    </span>
                  </div>
                ))}
              </div>
            </ResultCard>

            <ResultCard title="Case Study Outlines">
              <div className="space-y-4">
                {insights.caseStudyOutlines.map((study, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg"
                  >
                    <h4 className="font-medium text-gray-200 mb-3">
                      {study.title}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        <strong className="text-gray-300">Hook:</strong>{" "}
                        {study.hook}
                      </p>
                      <div>
                        <strong className="text-gray-300">Key Points:</strong>
                        <ul className="list-disc pl-5 mt-1">
                          {study.keyPoints.map((pt, j) => (
                            <li key={j}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                      <p>
                        <strong className="text-gray-300">CTA:</strong>{" "}
                        {study.cta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ResultCard>
          </div>
        </>
      )}
    </div>
  );
}
