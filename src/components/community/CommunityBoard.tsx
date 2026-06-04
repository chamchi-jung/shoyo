"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  CommunityCategory,
  CommunityImage,
  CommunityPost,
  CommunityReply,
  communityCategories,
  sampleCommunityPosts
} from "@/data/community";
import { isLikelyYouTubeVideoId, parseYouTubeVideoId } from "@/lib/youtube";

type CategoryFilter = "전체" | CommunityCategory;

type PostDraft = {
  category: CommunityCategory;
  title: string;
  author: string;
  body: string;
  youtubeUrl: string;
};

type ReplyDraft = {
  author: string;
  body: string;
};

const storageKey = "plain-community-posts-v1";
const categoryFilters: CategoryFilter[] = ["전체", ...communityCategories];
const bodyMarkerPattern = /\[(youtube|image:(\d+))\]/gi;

const initialPostDraft: PostDraft = {
  category: "잡담",
  title: "",
  author: "",
  body: "",
  youtubeUrl: ""
};

const initialReplyDraft: ReplyDraft = {
  author: "",
  body: ""
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function normalizeYouTubeId(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const parsed = parseYouTubeVideoId(trimmed);
  return parsed && isLikelyYouTubeVideoId(parsed) ? parsed : "";
}

function readImage(file: File): Promise<CommunityImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: createId("image"),
        name: file.name,
        dataUrl: String(reader.result)
      });
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getReplyCount(post: CommunityPost) {
  return post.replies.length;
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="youtube-frame">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
      />
    </div>
  );
}

function PostImage({ image }: { image: CommunityImage }) {
  return (
    <figure className="post-image">
      <img alt={image.name} src={image.dataUrl} />
      <figcaption>{image.name}</figcaption>
    </figure>
  );
}

function renderPostContent(post: CommunityPost) {
  const blocks: ReactNode[] = [];
  const placedImages = new Set<number>();
  let youtubePlaced = false;
  let textStart = 0;

  function pushText(value: string) {
    if (!value) {
      return;
    }

    blocks.push(
      <p className="post-body-text" key={`text-${blocks.length}`}>
        {value}
      </p>
    );
  }

  for (const match of post.body.matchAll(bodyMarkerPattern)) {
    pushText(post.body.slice(textStart, match.index));

    if (match[1].toLowerCase() === "youtube") {
      if (post.youtubeId) {
        blocks.push(<YouTubeEmbed key={`youtube-${blocks.length}`} videoId={post.youtubeId} />);
        youtubePlaced = true;
      } else {
        pushText(match[0]);
      }
    } else {
      const imageIndex = Number(match[2]) - 1;
      const image = post.images[imageIndex];

      if (image) {
        blocks.push(<PostImage image={image} key={`image-${image.id}-${blocks.length}`} />);
        placedImages.add(imageIndex);
      } else {
        pushText(match[0]);
      }
    }

    textStart = (match.index ?? 0) + match[0].length;
  }

  pushText(post.body.slice(textStart));

  if (post.youtubeId && !youtubePlaced) {
    blocks.push(<YouTubeEmbed key="youtube-trailing" videoId={post.youtubeId} />);
  }

  post.images.forEach((image, index) => {
    if (!placedImages.has(index)) {
      blocks.push(<PostImage image={image} key={`image-trailing-${image.id}`} />);
    }
  });

  return blocks;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizePosts(value: unknown): CommunityPost[] {
  if (!Array.isArray(value)) {
    return sampleCommunityPosts;
  }

  return value.map((item, index) => {
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const rawCategory = readString(record.category);
    const category = communityCategories.includes(rawCategory as CommunityCategory)
      ? (rawCategory as CommunityCategory)
      : "잡담";
    const youtubeUrl = readString(record.youtubeUrl);
    const youtubeId = readString(record.youtubeId) || normalizeYouTubeId(youtubeUrl);
    const rawImages = Array.isArray(record.images) ? record.images : [];
    const rawReplies = Array.isArray(record.replies) ? record.replies : [];

    return {
      id: readString(record.id, `saved-${index}`),
      category,
      title: readString(record.title, "제목 없음"),
      author: readString(record.author, "ㅇㅇ"),
      body: readString(record.body),
      createdAt: readString(record.createdAt, new Date().toISOString()),
      views: typeof record.views === "number" ? record.views : 0,
      youtubeUrl: youtubeUrl || undefined,
      youtubeId: youtubeId || undefined,
      images: rawImages
        .map((image, imageIndex) => {
          const imageRecord = image && typeof image === "object" ? (image as Record<string, unknown>) : {};

          return {
            id: readString(imageRecord.id, `saved-image-${index}-${imageIndex}`),
            name: readString(imageRecord.name, "image"),
            dataUrl: readString(imageRecord.dataUrl)
          };
        })
        .filter((image) => image.dataUrl),
      replies: rawReplies.map((reply, replyIndex) => {
        const replyRecord = reply && typeof reply === "object" ? (reply as Record<string, unknown>) : {};

        return {
          id: readString(replyRecord.id, `saved-reply-${index}-${replyIndex}`),
          author: readString(replyRecord.author, "ㅇㅇ"),
          body: readString(replyRecord.body),
          createdAt: readString(replyRecord.createdAt, new Date().toISOString())
        };
      })
    };
  });
}

export function CommunityBoard() {
  const [posts, setPosts] = useState<CommunityPost[]>(sampleCommunityPosts);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("전체");
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(sampleCommunityPosts[0]?.id ?? "");
  const [postDraft, setPostDraft] = useState<PostDraft>(initialPostDraft);
  const [replyDraft, setReplyDraft] = useState<ReplyDraft>(initialReplyDraft);
  const [draftImages, setDraftImages] = useState<CommunityImage[]>([]);
  const [writeOpen, setWriteOpen] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [persistMessage, setPersistMessage] = useState("");
  const bodyFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);

        if (saved) {
          const parsed = normalizePosts(JSON.parse(saved));
          setPosts(parsed);
          setSelectedPostId(parsed[0]?.id ?? "");
        }
      } catch {
        setPersistMessage("저장된 게시판 데이터를 불러오지 못했습니다.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const categoryMatch = selectedCategory === "전체" || post.category === selectedCategory;
      const queryMatch =
        !normalizedQuery ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.author.toLowerCase().includes(normalizedQuery) ||
        post.body.toLowerCase().includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [posts, query, selectedCategory]);

  const selectedPost = posts.find((post) => post.id === selectedPostId);
  const activePost = filteredPosts.find((post) => post.id === selectedPostId) ?? filteredPosts[0] ?? selectedPost ?? posts[0];
  const totalReplies = posts.reduce((sum, post) => sum + post.replies.length, 0);
  const totalImages = posts.reduce((sum, post) => sum + post.images.length, 0);

  function savePosts(nextPosts: CommunityPost[]) {
    setPosts(nextPosts);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextPosts));
      setPersistMessage("");
    } catch {
      setPersistMessage("브라우저 저장 공간이 부족합니다. 큰 사진을 줄이면 저장됩니다.");
    }
  }

  function openPost(postId: string) {
    const nextPosts = posts.map((post) => (post.id === postId ? { ...post, views: post.views + 1 } : post));

    setSelectedPostId(postId);
    savePosts(nextPosts);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4);

    if (!files.length) {
      return;
    }

    try {
      const images = await Promise.all(files.map(readImage));
      setDraftImages((currentImages) => [...currentImages, ...images].slice(0, 4));
      setFormMessage("");
    } catch {
      setFormMessage("사진을 읽지 못했습니다.");
    } finally {
      input.value = "";
    }
  }

  function removeDraftImage(imageId: string) {
    setDraftImages((currentImages) => currentImages.filter((image) => image.id !== imageId));
  }

  function insertBodyMarker(marker: string) {
    const field = bodyFieldRef.current;
    const body = postDraft.body;
    const selectionStart = field?.selectionStart ?? body.length;
    const selectionEnd = field?.selectionEnd ?? selectionStart;
    const before = body.slice(0, selectionStart);
    const after = body.slice(selectionEnd);
    const prefix = before && !before.endsWith("\n") ? "\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n" : "";
    const inserted = `${prefix}${marker}${suffix}`;
    const nextBody = `${before}${inserted}${after}`;
    const nextCursor = before.length + inserted.length;

    setPostDraft((current) => ({ ...current, body: nextBody }));

    window.setTimeout(() => {
      field?.focus();
      field?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = postDraft.title.trim();
    const body = postDraft.body.trim();
    const youtubeUrl = postDraft.youtubeUrl.trim();
    const youtubeId = normalizeYouTubeId(youtubeUrl);

    if (!title || !body) {
      setFormMessage("제목과 본문을 입력하세요.");
      return;
    }

    if (youtubeUrl && !youtubeId) {
      setFormMessage("유튜브 주소를 확인하세요.");
      return;
    }

    const nextPost: CommunityPost = {
      id: createId("post"),
      category: postDraft.category,
      title,
      author: postDraft.author.trim() || "ㅇㅇ",
      body,
      createdAt: new Date().toISOString(),
      views: 0,
      youtubeUrl: youtubeUrl || undefined,
      youtubeId: youtubeId || undefined,
      images: draftImages,
      replies: []
    };

    savePosts([nextPost, ...posts]);
    setSelectedPostId(nextPost.id);
    setPostDraft(initialPostDraft);
    setDraftImages([]);
    setWriteOpen(false);
    setSelectedCategory("전체");
    setQuery("");
    setFormMessage("");
  }

  function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activePost || !replyDraft.body.trim()) {
      return;
    }

    const nextReply: CommunityReply = {
      id: createId("reply"),
      author: replyDraft.author.trim() || "ㅇㅇ",
      body: replyDraft.body.trim(),
      createdAt: new Date().toISOString()
    };

    savePosts(
      posts.map((post) => (post.id === activePost.id ? { ...post, replies: [...post.replies, nextReply] } : post))
    );
    setReplyDraft(initialReplyDraft);
  }

  function resetBoard() {
    savePosts(sampleCommunityPosts);
    setSelectedPostId(sampleCommunityPosts[0]?.id ?? "");
    setSelectedCategory("전체");
    setQuery("");
    setReplyDraft(initialReplyDraft);
    setPostDraft(initialPostDraft);
    setDraftImages([]);
    setWriteOpen(false);
  }

  return (
    <main className="community-shell">
      <header className="site-header">
        <div>
          <p className="site-kicker">haejeuseyo community</p>
          <h1>해즈세요</h1>
        </div>
        <div className="header-stats" aria-label="게시판 통계">
          <span>글 {posts.length}</span>
          <span>댓글 {totalReplies}</span>
          <span>사진 {totalImages}</span>
        </div>
      </header>

      <section className="notice-line" aria-label="공지">
        <strong>공지</strong>
        <span>해즈세요 임시 게시판입니다. 로그인 없이 닉네임만 적고 글을 올립니다.</span>
      </section>

      <section className="board-toolbar" aria-label="게시판 도구">
        <div className="category-tabs">
          {categoryFilters.map((category) => (
            <button
              data-active={selectedCategory === category}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <label className="search-field">
          <span>검색</span>
          <input onChange={(event) => setQuery(event.target.value)} value={query} />
        </label>
        <div className="toolbar-actions">
          <button onClick={() => setWriteOpen((current) => !current)} type="button">
            글쓰기
          </button>
          <button onClick={resetBoard} type="button">
            초기화
          </button>
        </div>
      </section>

      {writeOpen ? (
        <section className="write-panel" aria-label="글쓰기">
          <div className="panel-title">
            <h2>글쓰기</h2>
            <button onClick={() => setWriteOpen(false)} type="button">
              닫기
            </button>
          </div>
          <form onSubmit={submitPost}>
            <div className="write-grid">
              <label>
                <span>말머리</span>
                <select
                  onChange={(event) =>
                    setPostDraft((current) => ({
                      ...current,
                      category: event.target.value as CommunityCategory
                    }))
                  }
                  value={postDraft.category}
                >
                  {communityCategories
                    .filter((category) => category !== "공지")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>닉네임</span>
                <input
                  onChange={(event) => setPostDraft((current) => ({ ...current, author: event.target.value }))}
                  placeholder="ㅇㅇ"
                  value={postDraft.author}
                />
              </label>
            </div>
            <label>
              <span>제목</span>
              <input
                onChange={(event) => setPostDraft((current) => ({ ...current, title: event.target.value }))}
                value={postDraft.title}
              />
            </label>
            <label>
              <span>본문</span>
              <textarea
                ref={bodyFieldRef}
                onChange={(event) => setPostDraft((current) => ({ ...current, body: event.target.value }))}
                rows={8}
                value={postDraft.body}
              />
            </label>
            <div className="media-field">
              <label>
                <span>유튜브 URL</span>
                <input
                  onChange={(event) => setPostDraft((current) => ({ ...current, youtubeUrl: event.target.value }))}
                  value={postDraft.youtubeUrl}
                />
              </label>
              <button disabled={!postDraft.youtubeUrl.trim()} onClick={() => insertBodyMarker("[youtube]")} type="button">
                본문에 넣기
              </button>
            </div>
            <label>
              <span>사진</span>
              <input accept="image/*" multiple onChange={handleImageChange} type="file" />
            </label>
            {draftImages.length ? (
              <div className="image-preview-list" aria-label="첨부 사진">
                {draftImages.map((image) => (
                  <figure key={image.id}>
                    <img alt={image.name} src={image.dataUrl} />
                    <figcaption>
                      <span>{image.name}</span>
                      <div>
                        <button
                          onClick={() => insertBodyMarker(`[image:${draftImages.indexOf(image) + 1}]`)}
                          type="button"
                        >
                          본문에 넣기
                        </button>
                        <button onClick={() => removeDraftImage(image.id)} type="button">
                          삭제
                        </button>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {formMessage ? <p className="form-message">{formMessage}</p> : null}
            <button className="submit-button" type="submit">
              등록
            </button>
          </form>
        </section>
      ) : null}

      <div className="board-layout">
        <section className="post-list-panel" aria-label="글 목록">
          <div className="post-table">
            <div className="post-row post-row-head">
              <span>번호</span>
              <span>말머리</span>
              <span>제목</span>
              <span>글쓴이</span>
              <span>시간</span>
              <span>조회</span>
            </div>
            {filteredPosts.map((post, index) => (
              <button
                className="post-row"
                data-active={activePost?.id === post.id}
                key={post.id}
                onClick={() => openPost(post.id)}
                type="button"
              >
                <span>{posts.length - index}</span>
                <span>{post.category}</span>
                <strong>
                  {post.title}
                  {getReplyCount(post) ? <em>[{getReplyCount(post)}]</em> : null}
                  {post.youtubeId ? <small>영상</small> : null}
                  {post.images.length ? <small>사진</small> : null}
                </strong>
                <span>{post.author}</span>
                <span>{formatDate(post.createdAt)}</span>
                <span>{post.views}</span>
              </button>
            ))}
            {!filteredPosts.length ? <p className="empty-state">글이 없습니다.</p> : null}
          </div>
        </section>

        <section className="post-detail-panel" aria-label="본문">
          {activePost ? (
            <article>
              <header className="post-detail-head">
                <p>{activePost.category}</p>
                <h2>{activePost.title}</h2>
                <div>
                  <span>{activePost.author}</span>
                  <span>{formatDate(activePost.createdAt)}</span>
                  <span>조회 {activePost.views}</span>
                </div>
              </header>
              <div className="post-content">{renderPostContent(activePost)}</div>
              <section className="reply-section" aria-label="댓글">
                <h3>댓글 {activePost.replies.length}</h3>
                <div className="reply-list">
                  {activePost.replies.map((reply) => (
                    <article key={reply.id}>
                      <strong>{reply.author}</strong>
                      <p>{reply.body}</p>
                      <span>{formatDate(reply.createdAt)}</span>
                    </article>
                  ))}
                  {!activePost.replies.length ? <p className="empty-state">댓글이 없습니다.</p> : null}
                </div>
                <form className="reply-form" onSubmit={submitReply}>
                  <input
                    onChange={(event) => setReplyDraft((current) => ({ ...current, author: event.target.value }))}
                    placeholder="닉네임"
                    value={replyDraft.author}
                  />
                  <textarea
                    onChange={(event) => setReplyDraft((current) => ({ ...current, body: event.target.value }))}
                    placeholder="댓글"
                    rows={3}
                    value={replyDraft.body}
                  />
                  <button type="submit">등록</button>
                </form>
              </section>
            </article>
          ) : (
            <p className="empty-state">선택된 글이 없습니다.</p>
          )}
        </section>
      </div>

      {persistMessage ? <p className="persist-message">{persistMessage}</p> : null}
    </main>
  );
}
