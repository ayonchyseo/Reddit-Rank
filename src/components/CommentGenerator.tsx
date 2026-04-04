import { useState } from "react";
import { MessageSquare, ShieldCheck, AlertTriangle, Copy, Check } from "lucide-react";
import { useReddit, fetchReddit } from "../hooks/useReddit";
import { analyzeWithGemini, parseGeminiJson } from "../hooks/useGemini";
import { LoadingSpinner } from "./shared/LoadingSpinner";
import { ResultCard } from "./shared/ResultCard";

interface ReplyData {
  comment: string;
  safetyAnalysis: string;
  ruleViolationsAvoided: string[];
}

export function CommentGenerator() {
  const [postUrl, setPostUrl] = useState("");
  const [coreMessage, setCoreMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReplyData | null>(null);
  const [copied, setCopied] = useState(false);

  const { loading, error, execute } = useReddit();

  const handleGenerate = async () => {
    if (!postUrl.trim()) return;

    const match = postUrl.match(/r\/([^/]+)\/comments\/([^/]+)/);
    if (!match) {
      alert("Please enter a valid Reddit post URL (e.g., https://www.reddit.com/r/SEO/comments/...)");
      return;
    }

    const subreddit = match[1];
    const postId = match[2];

    setIsAnalyzing(true);
    setResult(null);

    try {
      const [postData, rulesData] = await Promise.all([
        execute(fetchReddit(`r/${subreddit}/comments/${postId}`)),
        execute(fetchReddit(`r/${subreddit}/about/rules`))
      ]);

      if (!postData || !postData[0]?.data?.children?.[0]?.data) {
        throw new Error("Could not fetch post data. Make sure the URL is correct.");
      }

      const post = postData[0].data.children[0].data;
      const rules = rulesData?.rules || [];

      const rulesText = rules
        .map((r: any, i: number) => `${i + 1}. ${r.short_name}: ${r.description}`)
        .join("\n");

      const prompt = `
You are a regular Reddit user who genuinely enjoys helping people online.
You have NO agenda, NO product to sell. You just want to write a real, helpful comment.

CRITICAL RULES:
- Write like a real human: casual tone, occasional imperfection, no corporate language
- NO bullet points unless the post itself is technical/list-based
- NO self-promotion unless the user's core message is provided AND it fits 100% naturally
- Keep it SHORT to MEDIUM length — 2 to 5 sentences usually. Long comments scream bot.
- Never start with "Great post!", "This is such a good question", or any compliment opener
- Never use phrases like "I hope this helps!", "Feel free to ask!", "As someone who..."
- React to ONE specific detail from the post title or body — show you actually read it
- Match the subreddit's vibe: casual subreddits get casual replies, technical ones get technical replies
- If no core message is provided, DO NOT promote anything at all

SUBREDDIT CONTEXT: r/${subreddit}
SUBREDDIT RULES:
${rulesText || "Follow general Reddit etiquette. No spam, be helpful and genuine."}

POST TITLE: ${post.title}
POST BODY: ${post.selftext || "(No body — image or link post)"}

${
  coreMessage
    ? `USER WANTS TO NATURALLY MENTION: ${coreMessage}
Only include this if it genuinely fits the conversation. If it feels forced, skip it entirely.`
    : "No promotion needed. Just be helpful."
}

Generate a JSON response with these exact keys:
{
  "comment": "The comment text. Sound like a real person. No markdown headers. Keep it concise.",
  "safetyAnalysis": "One sentence: why this won't get flagged.",
  "ruleViolationsAvoided": ["Short rule name: how avoided"]
}
Return ONLY valid JSON. No markdown blocks outside the JSON.
`;

      const aiResult = await analyzeWithGemini(prompt);
      const parsed = parseGeminiJson<ReplyData>(aiResult);
      if (parsed) setResult(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.comment);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-2">Safe Reply Generator</h2>
        <p className="text-gray-400">
          Generate authentic, high-value comments that adhere to subreddit rules and avoid bans.
        </p>
      </header>

      <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Reddit Post URL</label>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://www.reddit.com/r/Entrepreneur/comments/..."
              className="w-full pl-12 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Core Message / Product (Optional)
          </label>
          <textarea
            value={coreMessage}
            onChange={(e) => setCoreMessage(e.target.value)}
            placeholder="E.g., Mention that my tool 'Reddit-Rank' helps find these opportunities automatically."
            className="w-full p-4 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-reddit focus:ring-1 focus:ring-reddit text-gray-100 h-24 resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || isAnalyzing || !postUrl.trim()}
          className="w-full sm:w-auto px-8 py-3 bg-reddit hover:bg-reddit-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading || isAnalyzing ? (
            "Generating Safe Reply..."
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" /> Generate Reply
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {(loading || isAnalyzing) && (
        <LoadingSpinner text="Analyzing subreddit rules and generating a safe response..." />
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-reddit" />
                Generated Comment
              </h3>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-6 bg-gray-950">
              <div className="prose prose-invert max-w-none">
                {result.comment.split("\n").map((paragraph, idx) => (
                  <p key={idx} className="text-gray-300 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard title="Safety Analysis">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <p className="text-gray-300 leading-relaxed">{result.safetyAnalysis}</p>
              </div>
            </ResultCard>

            <ResultCard title="Rules Respected">
              <ul className="space-y-3">
                {result.ruleViolationsAvoided.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-reddit shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          </div>
        </div>
      )}
    </div>
  );
}
