import { isLikelyYouTubeVideoId, parseYouTubeVideoId } from "@/lib/youtube";

type YouTubeEmbedProps = {
  title: string;
  url: string;
};

export function YouTubeEmbed({ title, url }: YouTubeEmbedProps) {
  const videoId = parseYouTubeVideoId(url);

  if (!isLikelyYouTubeVideoId(videoId)) {
    return (
      <div className="youtube-placeholder">
        <p className="archive-label">영상 자리</p>
        <strong>올바른 유튜브 주소를 붙여넣어 주세요</strong>
        <span>youtube.com/watch, youtu.be, shorts, live, embed 링크를 지원합니다.</span>
      </div>
    );
  }

  return (
    <div className="youtube-frame">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
      />
    </div>
  );
}
