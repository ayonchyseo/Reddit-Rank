import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path, ...params } = req.query;
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();

  const url = `https://www.reddit.com/${path}.json?${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditRank:v1.0 (by /u/redditrank_tool)',
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Reddit fetch failed', details: String(err) });
  }
}
