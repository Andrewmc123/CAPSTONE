import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHashtag } from "react-icons/fa6";
import { fetchHashtagVideos, selectCollection } from "../../redux/posts";
import VideoGrid from "../VideoGrid";
import { compact } from "../../utils/format";
import "./HashtagPage.css";

export default function HashtagPage() {
  const { tag } = useParams();
  const dispatch = useDispatch();
  const posts = useSelector(selectCollection(`tag:${tag?.toLowerCase()}`));
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dispatch(fetchHashtagVideos(tag)).then((data) => {
      if (data) setStats({ views: data.total_views, count: data.video_count });
    });
  }, [dispatch, tag]);

  return (
    <div className="page hashtag-page">
      <header className="hashtag-head">
        <div className="hashtag-bubble"><FaHashtag /></div>
        <div>
          <h1>#{tag}</h1>
          {stats && (
            <p className="text-dim">{compact(stats.views)} views · {stats.count} videos</p>
          )}
        </div>
      </header>
      <VideoGrid posts={posts} emptyText={`No videos for #${tag} yet — start the trend!`} />
    </div>
  );
}
