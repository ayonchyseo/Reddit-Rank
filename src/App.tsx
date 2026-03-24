/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Search, Loader2, AlertCircle, MessageSquare, Frown, Hash, ChevronRight, Target, Link as LinkIcon, Rss, Globe, Filter, Star, ExternalLink, Lightbulb, Wrench, Compass, PenTool, RefreshCw, Zap, Smile, BookOpen, ShieldCheck, Brain, TrendingUp, ThumbsUp, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getApiKey = () => {
  // Try Vite's import.meta.env first
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  // Fallback to process.env (which we define in vite.config.ts)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      // @ts-ignore
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // process might not be defined
  }
  return '';
};

const apiKey = getApiKey();
console.log('Gemini API Key Status:', apiKey ? 'Present (starts with ' + apiKey.slice(0, 4) + '...)' : 'Missing');

interface IntentData {
  coreTopic: string;
  problemPhrases: string[];
  emotionalPhrases: string[];
  subreddits: string[];
}

interface ScrapingTargets {
  redditSearchUrls: string[];
  subredditRssFeeds: string[];
  googleSearchQueries: string[];
}

interface FilteredPost {
  title: string;
  url: string;
  subreddit: string;
  problemSummary: string;
  intentType: string;
  opportunityScore: number;
}

interface DiscussionAnalysis {
  realProblem: string;
  rootCause: string;
  alreadyTried: string;
  missingInAnswers: string;
  bestReplyAngle: string;
}

interface ReplyVariations {
  shortDirect: string;
  friendlyCasual: string;
  insightHeavy: string;
  persuasive: string;
}

interface LearningAnalysis {
  whatWorked: string;
  whatDidntWork: string;
  improvedVersion: string;
  patternToReuse: string;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<IntentData | null>(null);

  const [targets, setTargets] = useState<ScrapingTargets | null>(null);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targetError, setTargetError] = useState('');

  const [scrapedPostsInput, setScrapedPostsInput] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<FilteredPost[] | null>(null);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [filterError, setFilterError] = useState('');

  const [discussionInput, setDiscussionInput] = useState('');
  const [discussionAnalysis, setDiscussionAnalysis] = useState<DiscussionAnalysis | null>(null);
  const [loadingDiscussion, setLoadingDiscussion] = useState(false);
  const [discussionError, setDiscussionError] = useState('');

  const [generatedReply, setGeneratedReply] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const [variations, setVariations] = useState<ReplyVariations | null>(null);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [variationsError, setVariationsError] = useState('');

  const [learningReply, setLearningReply] = useState('');
  const [learningEngagement, setLearningEngagement] = useState('');
  const [learningAnalysis, setLearningAnalysis] = useState<LearningAnalysis | null>(null);
  const [loadingLearning, setLoadingLearning] = useState(false);
  const [learningError, setLearningError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    if (!apiKey) {
      setError('Gemini API key is missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setTargets(null);
    setTargetError('');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an intent analyzer.

User gives a topic. You expand it into real human search intent.

Rules:
- Keep it simple and short
- Use real words people say
- Focus on problems, not definitions
- No generic phrases

Input:
${topic}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coreTopic: {
                type: Type.STRING,
                description: 'Core topic (1 line)',
              },
              problemPhrases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '10 problem-based search phrases',
              },
              emotionalPhrases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '10 emotional intent phrases (frustration, confusion, need help)',
              },
              subreddits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5 subreddit suggestions',
              },
            },
            required: ['coreTopic', 'problemPhrases', 'emotionalPhrases', 'subreddits'],
          },
        },
      });

      if (response.text) {
        setResult(JSON.parse(response.text));
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTargets = async () => {
    if (!result) return;
    setLoadingTargets(true);
    setTargetError('');

    if (!apiKey) {
      setTargetError('Gemini API key is missing.');
      setLoadingTargets(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const expanded_keywords = [...result.problemPhrases, ...result.emotionalPhrases].join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a Reddit data collector.

Your job is to generate scraping targets.

Rules:
- Focus on recent posts only
- Prioritize problem-based discussions
- Avoid old or high-comment threads

Input:
${expanded_keywords}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              redditSearchUrls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '20 Reddit search URLs (sorted by new)',
              },
              subredditRssFeeds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '15 subreddit RSS feeds',
              },
              googleSearchQueries: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '10 Google search queries using: site:reddit.com + keyword + problem words',
              },
            },
            required: ['redditSearchUrls', 'subredditRssFeeds', 'googleSearchQueries'],
          },
        },
      });

      if (response.text) {
        setTargets(JSON.parse(response.text));
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setTargetError(err.message || 'Failed to generate targets. Please try again.');
    } finally {
      setLoadingTargets(false);
    }
  };

  const handleAnalyzeDiscussion = async () => {
    if (!discussionInput.trim()) return;
    setLoadingDiscussion(true);
    setDiscussionError('');
    setDiscussionAnalysis(null);

    if (!apiKey) {
      setDiscussionError('Gemini API key is missing.');
      setLoadingDiscussion(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a discussion analyzer.

You read a Reddit post and comments.

Rules:
- Understand what the user REALLY needs
- Ignore noise
- Focus on root problem

Input:
${discussionInput}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              realProblem: { type: Type.STRING, description: 'Real problem (simple sentence)' },
              rootCause: { type: Type.STRING, description: 'Why they are stuck (root cause)' },
              alreadyTried: { type: Type.STRING, description: 'What they already tried' },
              missingInAnswers: { type: Type.STRING, description: 'What is missing in current answers' },
              bestReplyAngle: { type: Type.STRING, description: 'Best reply angle (teach / fix / warn / guide)' },
            },
            required: ['realProblem', 'rootCause', 'alreadyTried', 'missingInAnswers', 'bestReplyAngle'],
          },
        },
      });

      if (response.text) {
        setDiscussionAnalysis(JSON.parse(response.text));
        setGeneratedReply(''); // Reset reply when new analysis is generated
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setDiscussionError(err.message || 'Failed to analyze discussion. Please try again.');
    } finally {
      setLoadingDiscussion(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!discussionAnalysis) return;
    setLoadingReply(true);
    setReplyError('');
    setGeneratedReply('');
    setVariations(null);

    if (!apiKey) {
      setReplyError('Gemini API key is missing.');
      setLoadingReply(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful Reddit user.

You write replies that feel real, simple, and useful.

Rules:
- Write like a human, not AI
- Use very simple words (easy to read)
- No complex sentences
- No marketing tone
- No links unless necessary
- Speak from experience style
- Use "you" tone
- Show cause → effect

Structure:
1. Start with understanding the problem
2. Explain why it happens
3. Give a clear fix or idea
4. Add a small insight most people miss

Avoid:
- “As an expert”
- Long paragraphs
- Robotic tone

Input:
${JSON.stringify(discussionAnalysis, null, 2)}

Output:
One natural Reddit reply (5–8 lines max)`,
      });

      if (response.text) {
        setGeneratedReply(response.text);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setReplyError(err.message || 'Failed to generate reply. Please try again.');
    } finally {
      setLoadingReply(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!generatedReply) return;
    setLoadingVariations(true);
    setVariationsError('');
    setVariations(null);

    if (!apiKey) {
      setVariationsError('Gemini API key is missing.');
      setLoadingVariations(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a reply rewriter.

Your job is to rewrite the same answer in 4 different human styles.

Rules:
- Keep meaning same
- Change tone and structure
- Make it feel written by different people

Input:
${generatedReply}

Output:
4 variations:
1. shortDirect: Short and direct version
2. friendlyCasual: Friendly and casual version
3. insightHeavy: Insight-heavy version
4. persuasive: Persuasive version`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shortDirect: { type: Type.STRING },
              friendlyCasual: { type: Type.STRING },
              insightHeavy: { type: Type.STRING },
              persuasive: { type: Type.STRING },
            },
            required: ['shortDirect', 'friendlyCasual', 'insightHeavy', 'persuasive'],
          },
        },
      });

      if (response.text) {
        setVariations(JSON.parse(response.text));
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setVariationsError(err.message || 'Failed to generate variations. Please try again.');
    } finally {
      setLoadingVariations(false);
    }
  };

  const handleAnalyzeLearning = async () => {
    if (!learningReply.trim()) return;
    setLoadingLearning(true);
    setLearningError('');
    setLearningAnalysis(null);

    if (!apiKey) {
      setLearningError('Gemini API key is missing.');
      setLoadingLearning(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a learning system.

You store patterns from successful Reddit replies.

Input:
- Reply: ${learningReply}
- Engagement data (upvotes, replies): ${learningEngagement}

Output:
1. whatWorked: What worked (tone, structure, idea)
2. whatDidntWork: What didn’t work
3. improvedVersion: Improved version of the reply
4. patternToReuse: Pattern to reuse in future`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              whatWorked: { type: Type.STRING },
              whatDidntWork: { type: Type.STRING },
              improvedVersion: { type: Type.STRING },
              patternToReuse: { type: Type.STRING },
            },
            required: ['whatWorked', 'whatDidntWork', 'improvedVersion', 'patternToReuse'],
          },
        },
      });

      if (response.text) {
        setLearningAnalysis(JSON.parse(response.text));
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setLearningError(err.message || 'Failed to analyze learning. Please try again.');
    } finally {
      setLoadingLearning(false);
    }
  };

  const handleFilterPosts = async () => {
    if (!scrapedPostsInput.trim()) return;
    setLoadingFilter(true);
    setFilterError('');
    setFilteredPosts(null);

    if (!apiKey) {
      setFilterError('Gemini API key is missing.');
      setLoadingFilter(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a content filter.

Your job is to select high-opportunity Reddit posts.

Rules:
- Keep posts with clear problems
- Remove generic or discussion-only posts
- Prefer low competition

Input:
${scrapedPostsInput}

Filter conditions:
- Comments less than 20
- Posted within 24–48 hours
- Contains problem intent`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                subreddit: { type: Type.STRING },
                problemSummary: { type: Type.STRING, description: 'Problem summary (1-2 lines)' },
                intentType: { type: Type.STRING, description: 'problem / comparison / beginner / urgent' },
                opportunityScore: { type: Type.NUMBER, description: 'Opportunity score (1-10)' },
              },
              required: ['title', 'url', 'subreddit', 'problemSummary', 'intentType', 'opportunityScore'],
            },
          },
        },
      });

      if (response.text) {
        setFilteredPosts(JSON.parse(response.text));
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setFilterError(err.message || 'Failed to filter posts. Please try again.');
    } finally {
      setLoadingFilter(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* API Key Warning */}
        {!apiKey && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gemini API Key Missing</p>
                <p className="text-sm opacity-90">The tool requires a Gemini API key to function. Please set <code>GEMINI_API_KEY</code> or <code>VITE_GEMINI_API_KEY</code> in your environment variables.</p>
                <div className="mt-2 p-2 bg-amber-100/50 rounded text-xs font-mono">
                  Debug Info: 
                  <br />- import.meta.env.VITE_GEMINI_API_KEY: {import.meta.env.VITE_GEMINI_API_KEY ? 'Present (starts with ' + import.meta.env.VITE_GEMINI_API_KEY.slice(0, 4) + '...)' : 'Missing'}
                  <br />- process.env.GEMINI_API_KEY: {typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? 'Present (starts with ' + process.env.GEMINI_API_KEY.slice(0, 4) + '...)' : 'Missing'}
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const ai = new GoogleGenAI({ apiKey: getApiKey() });
                      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'hi' });
                      alert('Connection successful! Response: ' + res.text);
                    } catch (e: any) {
                      alert('Connection failed: ' + e.message);
                    }
                  }}
                  className="mt-3 px-3 py-1 bg-amber-200 text-amber-900 rounded text-xs font-bold hover:bg-amber-300 transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
              <Search className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl mb-4">
              Search Intent Analyzer
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Discover what people are really searching for. Enter a topic to uncover real human problems, emotional intent, and community discussions.
            </p>
          </motion.div>
        </div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <form onSubmit={handleAnalyze} className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 'dog training', 'budgeting', 'learning react'"
                className="w-full pl-6 pr-32 py-4 text-lg bg-white border-2 border-zinc-200 rounded-2xl shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Analyze
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-2xl mx-auto mb-8 overflow-hidden"
            >
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Core Topic */}
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 bg-zinc-100 text-zinc-600 font-medium rounded-full text-sm tracking-wide uppercase mb-3">
                  Core Topic
                </span>
                <h2 className="text-3xl font-semibold text-zinc-900">
                  {result.coreTopic}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Problem Phrases */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900">Problem-Based Searches</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.problemPhrases.map((phrase, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-700">
                        <span className="text-amber-500 font-medium mt-0.5">•</span>
                        <span>{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Emotional Phrases */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                      <Frown className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900">Emotional Intent</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.emotionalPhrases.map((phrase, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-700">
                        <span className="text-rose-500 font-medium mt-0.5">•</span>
                        <span>{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Subreddits */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                    <Hash className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900">Where They Hang Out</h3>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {result.subreddits.map((sub, i) => (
                    <a
                      key={i}
                      href={`https://reddit.com/r/${sub.replace('r/', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-full text-zinc-700 font-medium transition-colors"
                    >
                      <Hash className="w-4 h-4 text-zinc-400" />
                      {sub.replace('r/', '')}
                    </a>
                  ))}
                </div>
              </div>

              {/* Generate Targets Button */}
              {!targets && !loadingTargets && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center pt-8 border-t border-zinc-200"
                >
                  <button
                    onClick={handleGenerateTargets}
                    className="px-8 py-4 bg-zinc-900 text-white font-medium rounded-2xl hover:bg-zinc-800 transition-colors flex items-center gap-3 shadow-sm"
                  >
                    <Target className="w-5 h-5" />
                    Generate Reddit Scraping Targets
                  </button>
                </motion.div>
              )}

              {/* Loading Targets State */}
              {loadingTargets && (
                <div className="flex justify-center pt-8 border-t border-zinc-200 text-zinc-500">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-zinc-100">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="font-medium">Generating scraping targets...</span>
                  </div>
                </div>
              )}

              {/* Targets Error State */}
              <AnimatePresence>
                {targetError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-w-2xl mx-auto mt-8 overflow-hidden"
                  >
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{targetError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scraping Targets Results */}
              {targets && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-8 border-t border-zinc-200 space-y-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900">Data Collection Targets</h2>
                    <p className="text-zinc-600 mt-2">Ready-to-use search URLs and feeds based on the intent analysis.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Reddit Search URLs */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col h-96">
                      <div className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-900">Reddit Search URLs</h3>
                      </div>
                      <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                        {targets.redditSearchUrls.map((url, i) => (
                          <div key={i} className="p-3 bg-zinc-50 rounded-xl text-sm break-all font-mono text-zinc-600 border border-zinc-100">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                              {url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subreddit RSS Feeds */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col h-96">
                      <div className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                          <Rss className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-900">Subreddit RSS Feeds</h3>
                      </div>
                      <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                        {targets.subredditRssFeeds.map((feed, i) => (
                          <div key={i} className="p-3 bg-zinc-50 rounded-xl text-sm break-all font-mono text-zinc-600 border border-zinc-100">
                            <a href={feed} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">
                              {feed}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Google Search Queries */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col h-96">
                      <div className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                          <Globe className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-900">Google Queries</h3>
                      </div>
                      <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                        {targets.googleSearchQueries.map((query, i) => (
                          <div key={i} className="p-3 bg-zinc-50 rounded-xl text-sm font-mono text-zinc-600 border border-zinc-100">
                            {query}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Filter Scraped Posts */}
              {targets && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-12 border-t border-zinc-200"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900">Filter Scraped Posts</h2>
                    <p className="text-zinc-600 mt-2">Paste your raw scraped Reddit posts below to find high-opportunity targets.</p>
                  </div>

                  <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                    <textarea
                      value={scrapedPostsInput}
                      onChange={(e) => setScrapedPostsInput(e.target.value)}
                      placeholder="Paste JSON or raw text of scraped posts here..."
                      className="w-full h-48 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none custom-scrollbar text-sm font-mono text-zinc-700 mb-4"
                      disabled={loadingFilter}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleFilterPosts}
                        disabled={loadingFilter || !scrapedPostsInput.trim()}
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {loadingFilter ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Filter className="w-4 h-4" />
                            Filter Posts
                          </>
                        )}
                      </button>
                    </div>

                    {/* Filter Error State */}
                    <AnimatePresence>
                      {filterError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{filterError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Filtered Results */}
                  {filteredPosts && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12 space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-zinc-900 text-center mb-6">
                        High-Opportunity Targets ({filteredPosts.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        {filteredPosts.map((post, i) => (
                          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-zinc-900 mb-1">{post.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg font-medium">
                                    <Hash className="w-3.5 h-3.5" />
                                    {post.subreddit.replace('r/', '')}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-medium capitalize">
                                    {post.intentType}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold shrink-0">
                                <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                                {post.opportunityScore}/10
                              </div>
                            </div>
                            <p className="text-zinc-600 mb-4">{post.problemSummary}</p>
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              View on Reddit
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                        {filteredPosts.length === 0 && (
                          <div className="text-center p-8 bg-zinc-50 rounded-3xl border border-zinc-200 text-zinc-500">
                            No high-opportunity posts found matching the criteria.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Analyze Discussion */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-12 mt-12 border-t border-zinc-200"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-zinc-900">Analyze Discussion</h2>
                      <p className="text-zinc-600 mt-2">Paste a specific Reddit post and its comments to find the best reply angle.</p>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                      <textarea
                        value={discussionInput}
                        onChange={(e) => setDiscussionInput(e.target.value)}
                        placeholder="Paste Reddit post and comments here..."
                        className="w-full h-48 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none custom-scrollbar text-sm font-mono text-zinc-700 mb-4"
                        disabled={loadingDiscussion}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleAnalyzeDiscussion}
                          disabled={loadingDiscussion || !discussionInput.trim()}
                          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {loadingDiscussion ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4" />
                              Analyze Discussion
                            </>
                          )}
                        </button>
                      </div>

                      {/* Discussion Error State */}
                      <AnimatePresence>
                        {discussionError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden"
                          >
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                              <p>{discussionError}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Discussion Analysis Results */}
                    {discussionAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 max-w-3xl mx-auto space-y-6"
                      >
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                              <Lightbulb className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-zinc-900">Discussion Insights</h3>
                              <p className="text-sm text-zinc-500">Deep dive into the user's core problem</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Real Problem</h4>
                              <p className="text-lg font-medium text-zinc-900">{discussionAnalysis.realProblem}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Search className="w-4 h-4" />
                                  Root Cause
                                </h4>
                                <p className="text-zinc-700">{discussionAnalysis.rootCause}</p>
                              </div>
                              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Wrench className="w-4 h-4" />
                                  Already Tried
                                </h4>
                                <p className="text-zinc-700">{discussionAnalysis.alreadyTried}</p>
                              </div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                              <h4 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Missing in Current Answers
                              </h4>
                              <p className="text-amber-900">{discussionAnalysis.missingInAnswers}</p>
                            </div>

                            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
                              <span className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Best Reply Angle</span>
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold capitalize">
                                <Compass className="w-4 h-4" />
                                {discussionAnalysis.bestReplyAngle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Generate Reply Button */}
                        {!generatedReply && !loadingReply && (
                          <div className="flex justify-center mt-8">
                            <button
                              onClick={handleGenerateReply}
                              className="px-8 py-4 bg-zinc-900 text-white font-medium rounded-2xl hover:bg-zinc-800 transition-colors flex items-center gap-3 shadow-sm"
                            >
                              <PenTool className="w-5 h-5" />
                              Draft Reddit Reply
                            </button>
                          </div>
                        )}

                        {/* Loading Reply State */}
                        {loadingReply && (
                          <div className="flex justify-center mt-8 text-zinc-500">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-zinc-100">
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                              <span className="font-medium">Drafting reply...</span>
                            </div>
                          </div>
                        )}

                        {/* Reply Error State */}
                        <AnimatePresence>
                          {replyError && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 overflow-hidden"
                            >
                              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>{replyError}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Generated Reply */}
                        {generatedReply && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 mt-8"
                          >
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100">
                              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                <MessageSquare className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-zinc-900">Drafted Reply</h3>
                                <p className="text-sm text-zinc-500">Ready to copy and paste</p>
                              </div>
                            </div>
                            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed text-lg">
                              {generatedReply}
                            </div>

                            {/* Variations Trigger */}
                            {!variations && !loadingVariations && (
                              <div className="flex justify-center mt-6">
                                <button
                                  onClick={handleGenerateVariations}
                                  className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-xl hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Generate 4 Style Variations
                                </button>
                              </div>
                            )}

                            {/* Loading Variations State */}
                            {loadingVariations && (
                              <div className="flex justify-center mt-6 text-zinc-500">
                                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-50 rounded-full border border-zinc-100">
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                  <span className="text-sm font-medium">Rewriting in different styles...</span>
                                </div>
                              </div>
                            )}

                            {/* Variations Error State */}
                            <AnimatePresence>
                              {variationsError && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 overflow-hidden"
                                >
                                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{variationsError}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Display Variations */}
                            {variations && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
                              >
                                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
                                  <div className="flex items-center gap-2 mb-3 text-zinc-500">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Short & Direct</span>
                                  </div>
                                  <p className="text-zinc-800 text-sm leading-relaxed">{variations.shortDirect}</p>
                                </div>

                                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
                                  <div className="flex items-center gap-2 mb-3 text-zinc-500">
                                    <Smile className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Friendly & Casual</span>
                                  </div>
                                  <p className="text-zinc-800 text-sm leading-relaxed">{variations.friendlyCasual}</p>
                                </div>

                                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
                                  <div className="flex items-center gap-2 mb-3 text-zinc-500">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Insight-Heavy</span>
                                  </div>
                                  <p className="text-zinc-800 text-sm leading-relaxed">{variations.insightHeavy}</p>
                                </div>

                                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
                                  <div className="flex items-center gap-2 mb-3 text-zinc-500">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Persuasive</span>
                                  </div>
                                  <p className="text-zinc-800 text-sm leading-relaxed">{variations.persuasive}</p>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Step 5: Learning System */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-12 mt-12 border-t border-zinc-200"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-zinc-900 flex items-center justify-center gap-3">
                        <Brain className="w-7 h-7 text-indigo-600" />
                        Learning System
                      </h2>
                      <p className="text-zinc-600 mt-2">Analyze successful replies to extract winning patterns.</p>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-zinc-700 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Successful Reply
                          </label>
                          <textarea
                            value={learningReply}
                            onChange={(e) => setLearningReply(e.target.value)}
                            placeholder="Paste a reply that performed well..."
                            className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none custom-scrollbar text-sm text-zinc-700"
                            disabled={loadingLearning}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-zinc-700 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Engagement Data
                          </label>
                          <input
                            type="text"
                            value={learningEngagement}
                            onChange={(e) => setLearningEngagement(e.target.value)}
                            placeholder="e.g., '150 upvotes, 12 replies'"
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all text-sm text-zinc-700"
                            disabled={loadingLearning}
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={handleAnalyzeLearning}
                            disabled={loadingLearning || !learningReply.trim()}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          >
                            {loadingLearning ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Brain className="w-4 h-4" />
                                Extract Patterns
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Learning Error State */}
                      <AnimatePresence>
                        {learningError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden"
                          >
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
                              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                              <p>{learningError}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Learning Analysis Results */}
                    {learningAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 max-w-3xl mx-auto space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                            <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <ThumbsUp className="w-4 h-4" />
                              What Worked
                            </h4>
                            <p className="text-zinc-700 text-sm leading-relaxed">{learningAnalysis.whatWorked}</p>
                          </div>

                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                            <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Frown className="w-4 h-4" />
                              What Didn't Work
                            </h4>
                            <p className="text-zinc-700 text-sm leading-relaxed">{learningAnalysis.whatDidntWork}</p>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                          <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Improved Version
                          </h4>
                          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-zinc-800 text-sm italic">
                            "{learningAnalysis.improvedVersion}"
                          </div>
                        </div>

                        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-white">
                          <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 opacity-80">
                            <Zap className="w-4 h-4" />
                            Pattern to Reuse
                          </h4>
                          <p className="text-lg font-medium leading-relaxed">{learningAnalysis.patternToReuse}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
