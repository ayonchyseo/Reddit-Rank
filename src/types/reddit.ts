export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  ups: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  selftext: string;
  link_flair_text: string | null;
  upvote_ratio: number;
  is_video: boolean;
  post_hint?: string;
}

export interface RedditComment {
  id: string;
  body: string;
  ups: number;
  author: string;
  created_utc: number;
  permalink: string;
}

export interface SubredditAbout {
  display_name: string;
  title: string;
  public_description: string;
  subscribers: number;
  active_user_count: number;
  created_utc: number;
}
