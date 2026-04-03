import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { KeywordIntel } from "./components/KeywordIntel";
import { SubredditAnalyzer } from "./components/SubredditAnalyzer";
import { AEOFinder } from "./components/AEOFinder";
import { GEOTracker } from "./components/GEOTracker";
import { ContentIdeas } from "./components/ContentIdeas";
import { CompetitorSpy } from "./components/CompetitorSpy";
import { TrafficFinder } from "./components/TrafficFinder";
import { CommentGenerator } from "./components/CommentGenerator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<KeywordIntel />} />
          <Route path="subreddit" element={<SubredditAnalyzer />} />
          <Route path="aeo" element={<AEOFinder />} />
          <Route path="geo" element={<GEOTracker />} />
          <Route path="ideas" element={<ContentIdeas />} />
          <Route path="competitor" element={<CompetitorSpy />} />
          <Route path="traffic" element={<TrafficFinder />} />
          <Route path="reply" element={<CommentGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
