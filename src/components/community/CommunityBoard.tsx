"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CommunityCategory, CommunityPost, CommunityReply } from "@/data/community";
import { communityCategories, sampleCommunityPosts } from "@/data/community";
import { getSignInErrorMessage } from "@/lib/authMessages";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const localPostsKey = "shoyo:community-member-posts";
const localRepliesKey = "shoyo:community-member-replies";
const allCategoryLabel = "전체";
const communityCategoryTabs: Array<CommunityCategory | typeof allCategoryLabel> = [allCategoryLabel, ...communityCategories];

type PostFormState = {
  title: string;
  author: string;
  category: CommunityCategory;
  body: string;
  tags: string;
};

type ReplyFormState = {
  author: string;
  body: string;
};

type CommunityView = "list" | "post" | "write";

type CommunityPostRow = {
  id: string;
  author: string;
  title: string;
  body: string;
  category: CommunityCategory;
  tags: string[] | null;
  views: number | null;
  created_at: string;
};

type CommunityReplyRow = {
  id: string;
  post_id: string;
  author: string;
  body: string;
  created_at: string;
};

const initialPostForm: PostFormState = {
  title: "",
  author: "",
  category: "잡담",
  body: "",
  tags: ""
};

const initialReplyForm: ReplyFormState = {
  author: "",
  body: ""
};

function isCommunityCategory(value: unknown): value is CommunityCategory {
  return typeof value === "string" && communityCategories.includes(value as CommunityCategory);
}

function isCommunityReply(value: unknown): value is CommunityReply {
  const reply = value as Partial<CommunityReply>;

  return Boolean(
    reply &&
      typeof reply.id === "string" &&
      typeof reply.author === "string" &&
      typeof reply.body === "string" &&
      typeof reply.createdAt === "string"
  );
}

function isCommunityPost(value: unknown): value is CommunityPost {
  const post = value as Partial<CommunityPost>;

  return Boolean(
    post &&
      typeof post.id === "string" &&
      typeof post.title === "string" &&
      typeof post.author === "string" &&
      typeof post.body === "string" &&
      typeof post.createdAt === "string" &&
      isCommunityCategory(post.category) &&
      typeof post.views === "number" &&
      Array.isArray(post.tags) &&
      (!post.replies || Array.isArray(post.replies))
  );
}

function readLocalPosts() {
  try {
    const saved = window.localStorage.getItem(localPostsKey);
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];

    return Array.isArray(parsed) ? parsed.filter(isCommunityPost) : [];
  } catch {
    return [];
  }
}

function readLocalReplies() {
  try {
    const saved = window.localStorage.getItem(localRepliesKey);
    const parsed = saved ? (JSON.parse(saved) as unknown) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, CommunityReply[]>>((replies, [postId, value]) => {
      if (Array.isArray(value)) {
        replies[postId] = value.filter(isCommunityReply);
      }

      return replies;
    }, {});
  } catch {
    return {};
  }
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getMemberName(session: Session | null) {
  return session?.user.email?.split("@")[0] || "회원";
}

function profileSlugFromAuthor(author: string) {
  const normalized = author
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || encodeURIComponent(author.trim() || "member");
}

function getAuthorProfileHref(author: string) {
  return `/profile/${profileSlugFromAuthor(author)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toCommunityPost(row: CommunityPostRow): CommunityPost {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    body: row.body,
    category: row.category,
    createdAt: row.created_at,
    views: row.views ?? 0,
    tags: row.tags ?? []
  };
}

function toCommunityReply(row: CommunityReplyRow): CommunityReply {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at
  };
}

function countReplies(post: CommunityPost, replies: Record<string, CommunityReply[]>) {
  return (post.replies?.length ?? 0) + (replies[post.id]?.length ?? 0);
}

export function CommunityBoard() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState(() => (supabase ? "" : "회원 글쓰기를 쓰려면 Supabase 연결이 필요합니다."));
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [remotePosts, setRemotePosts] = useState<CommunityPost[]>([]);
  const [remoteReplies, setRemoteReplies] = useState<Record<string, CommunityReply[]>>({});
  const [localPosts, setLocalPosts] = useState<CommunityPost[]>([]);
  const [localReplies, setLocalReplies] = useState<Record<string, CommunityReply[]>>({});
  const [activePostId, setActivePostId] = useState(sampleCommunityPosts[0]?.id ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | typeof allCategoryLabel>(allCategoryLabel);
  const [query, setQuery] = useState("");
  const [postForm, setPostForm] = useState<PostFormState>(initialPostForm);
  const [replyForm, setReplyForm] = useState<ReplyFormState>(initialReplyForm);
  const [view, setView] = useState<CommunityView>("list");
  const canWrite = Boolean(session);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setPostForm((current) => ({ ...current, author: current.author || getMemberName(data.session) }));
        setReplyForm((current) => ({ ...current, author: current.author || getMemberName(data.session) }));
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setPostForm((current) => ({ ...current, author: current.author || getMemberName(nextSession) }));
      setReplyForm((current) => ({ ...current, author: current.author || getMemberName(nextSession) }));
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const savedPosts = readLocalPosts();
      const savedReplies = readLocalReplies();

      setLocalPosts(savedPosts);
      setLocalReplies(savedReplies);
      setActivePostId(savedPosts[0]?.id ?? sampleCommunityPosts[0]?.id ?? "");
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    void Promise.all([
      supabase.from("community_posts").select("id, author, title, body, category, tags, views, created_at").order("created_at", {
        ascending: false
      }),
      supabase.from("community_replies").select("id, post_id, author, body, created_at").order("created_at", { ascending: true })
    ])
      .then(([postResponse, replyResponse]) => {
        if (!isActive) {
          return;
        }

        if (postResponse.error || replyResponse.error) {
          setAuthMessage("커뮤니티 테이블이 아직 없으면 샘플 글만 보입니다. supabase/schema.sql을 적용하면 회원 글쓰기가 저장됩니다.");
          return;
        }

        const nextPosts = ((postResponse.data ?? []) as CommunityPostRow[]).map(toCommunityPost);
        const nextReplies = ((replyResponse.data ?? []) as CommunityReplyRow[]).reduce<Record<string, CommunityReply[]>>((replies, row) => {
          replies[row.post_id] = [...(replies[row.post_id] ?? []), toCommunityReply(row)];
          return replies;
        }, {});

        setRemotePosts(nextPosts);
        setRemoteReplies(nextReplies);
        setActivePostId(nextPosts[0]?.id ?? sampleCommunityPosts[0]?.id ?? "");
      })
      .catch(() => {
        if (isActive) {
          setAuthMessage("커뮤니티 글을 불러오지 못했습니다. 샘플 글로 계속 볼 수 있습니다.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const repliesByPost = useMemo(() => ({ ...remoteReplies, ...localReplies }), [localReplies, remoteReplies]);
  const posts = useMemo(() => [...localPosts, ...remotePosts, ...sampleCommunityPosts], [localPosts, remotePosts]);
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = selectedCategory === allCategoryLabel || post.category === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        [post.title, post.author, post.body, post.category, ...post.tags].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [posts, query, selectedCategory]);

  const activePost = posts.find((post) => post.id === activePostId) ?? filteredPosts[0] ?? posts[0];
  const activeReplies = activePost ? [...(activePost.replies ?? []), ...(repliesByPost[activePost.id] ?? [])] : [];

  function saveLocalPosts(nextPosts: CommunityPost[]) {
    setLocalPosts(nextPosts);
    window.localStorage.setItem(localPostsKey, JSON.stringify(nextPosts));
  }

  function saveLocalReplies(nextReplies: Record<string, CommunityReply[]>) {
    setLocalReplies(nextReplies);
    window.localStorage.setItem(localRepliesKey, JSON.stringify(nextReplies));
  }

  function openPost(postId: string) {
    setActivePostId(postId);
    setView("post");
  }

  function openWriteView() {
    if (!canWrite) {
      setAuthMessage("가입한 회원만 글을 쓸 수 있습니다. 로그인하거나 가입해주세요.");
      return;
    }

    setView("write");
  }

  async function runAuthAction(action: () => Promise<void>) {
    if (!supabase) {
      return;
    }

    setIsAuthBusy(true);
    setAuthMessage("");

    try {
      await action();
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "계정 처리 중 오류가 났습니다.");
    } finally {
      setIsAuthBusy(false);
    }
  }

  function signUp() {
    void runAuthAction(async () => {
      const { error } = await supabase!.auth.signUp({ email: authEmail, password: authPassword });

      if (error) {
        throw error;
      }

      setAuthMessage("가입 요청이 완료됐습니다. 메일 확인 설정이 켜져 있으면 확인 뒤 로그인해주세요.");
    });
  }

  function signIn() {
    void runAuthAction(async () => {
      const { error } = await supabase!.auth.signInWithPassword({ email: authEmail, password: authPassword });

      if (error) {
        throw new Error(getSignInErrorMessage(error));
      }

      setAuthMessage("로그인했습니다. 이제 글과 댓글을 쓸 수 있습니다.");
    });
  }

  function signOut() {
    void runAuthAction(async () => {
      const { error } = await supabase!.auth.signOut();

      if (error) {
        throw error;
      }

      setAuthMessage("로그아웃했습니다.");
    });
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canWrite || !session || !postForm.title.trim() || !postForm.body.trim()) {
      return;
    }

    const nextPost: CommunityPost = {
      id: createLocalId("post"),
      title: postForm.title.trim(),
      author: postForm.author.trim() || getMemberName(session),
      body: postForm.body.trim(),
      category: postForm.category,
      createdAt: new Date().toISOString(),
      views: 0,
      tags: parseTags(postForm.tags)
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: session.user.id,
          author: nextPost.author,
          title: nextPost.title,
          body: nextPost.body,
          category: nextPost.category,
          tags: nextPost.tags
        })
        .select("id, author, title, body, category, tags, views, created_at")
        .maybeSingle<CommunityPostRow>();

      if (!error && data) {
        const savedPost = toCommunityPost(data);
        setRemotePosts((current) => [savedPost, ...current]);
        setActivePostId(savedPost.id);
        setView("post");
        setAuthMessage("글이 저장됐습니다.");
      } else {
        saveLocalPosts([nextPost, ...localPosts]);
        setActivePostId(nextPost.id);
        setView("post");
        setAuthMessage("원격 저장이 막혀서 로그인한 회원의 로컬 초안으로 저장했습니다. schema.sql 적용을 확인해주세요.");
      }
    }

    setSelectedCategory(allCategoryLabel);
    setQuery("");
    setPostForm({ ...initialPostForm, author: getMemberName(session) });
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canWrite || !session || !activePost || !replyForm.body.trim()) {
      return;
    }

    const nextReply: CommunityReply = {
      id: createLocalId("reply"),
      author: replyForm.author.trim() || getMemberName(session),
      body: replyForm.body.trim(),
      createdAt: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("community_replies")
        .insert({
          post_id: activePost.id,
          user_id: session.user.id,
          author: nextReply.author,
          body: nextReply.body
        })
        .select("id, post_id, author, body, created_at")
        .maybeSingle<CommunityReplyRow>();

      if (!error && data) {
        const savedReply = toCommunityReply(data);
        setRemoteReplies((current) => ({
          ...current,
          [activePost.id]: [...(current[activePost.id] ?? []), savedReply]
        }));
        setAuthMessage("댓글이 저장됐습니다.");
      } else {
        const nextReplies = {
          ...localReplies,
          [activePost.id]: [...(localReplies[activePost.id] ?? []), nextReply]
        };

        saveLocalReplies(nextReplies);
        setAuthMessage("원격 저장이 막혀서 로그인한 회원의 로컬 댓글로 저장했습니다. schema.sql 적용을 확인해주세요.");
      }
    }

    setReplyForm({ ...initialReplyForm, author: getMemberName(session) });
  }

  function renderPostList(position: "main" | "bottom" = "main") {
    return (
      <section className={`dc-board-wrap ${position === "bottom" ? "dc-board-wrap-bottom" : ""}`} aria-label="자유게시판 목록">
        <div className="dc-board-toolbar">
          <div className="dc-tabs">
            {communityCategoryTabs.map((category) => (
              <button data-active={selectedCategory === category} key={category} onClick={() => setSelectedCategory(category)} type="button">
                {category}
              </button>
            ))}
          </div>
          <label className="dc-search">
            <span>검색</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="제목, 내용, 글쓴이, 태그" value={query} />
          </label>
          <div className="dc-toolbar-actions">
            <button className="dc-action-button secondary" onClick={() => setView("list")} type="button">
              목록
            </button>
            <button className="dc-action-button" onClick={openWriteView} type="button">
              글쓰기
            </button>
          </div>
        </div>

        <div className="dc-table" role="table" aria-label="게시글">
          <div className="dc-table-head" role="row">
            <span>번호</span>
            <span>말머리</span>
            <span>제목</span>
            <span>글쓴이</span>
            <span>작성일</span>
            <span>조회</span>
            <span>댓글</span>
          </div>
          {filteredPosts.map((post, index) => (
            <div
              className="dc-row"
              data-active={activePost?.id === post.id}
              key={post.id}
              role="row"
            >
              <span>{post.category === "공지" ? "공지" : filteredPosts.length - index}</span>
              <span>{post.category}</span>
              <button className="dc-title-button" onClick={() => openPost(post.id)} type="button">
                {post.title}
                {countReplies(post, repliesByPost) ? <em>[{countReplies(post, repliesByPost)}]</em> : null}
              </button>
              <Link className="dc-author-cell" href={getAuthorProfileHref(post.author)}>
                {post.author}
              </Link>
              <span>{formatDate(post.createdAt)}</span>
              <span>{post.views}</span>
              <span>{countReplies(post, repliesByPost)}</span>
            </div>
          ))}
          {!filteredPosts.length ? <p className="dc-empty">조건에 맞는 글이 없습니다.</p> : null}
        </div>
      </section>
    );
  }

  return (
    <main className="dc-shell">
      <section className="dc-gallery-head">
        <div>
          <p className="dc-eyebrow">shoyo community</p>
          <h1>shoyo 자유게시판</h1>
          <p>프로필, 취향 블록, 오늘의 추천, 아무 말이나 올리는 작은 게시판입니다.</p>
        </div>
        <div className="dc-member-box" data-logged-in={canWrite}>
          {session ? (
            <>
              <strong>{session.user.email}</strong>
              <span>회원으로 로그인 중</span>
              <button disabled={isAuthBusy} onClick={signOut} type="button">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <strong>회원 글쓰기</strong>
              <span>가입한 회원만 글과 댓글을 쓸 수 있습니다.</span>
            </>
          )}
        </div>
      </section>

      {!session ? (
        <section className="dc-login-strip" aria-label="회원 로그인">
          <div>
            <p className="dc-eyebrow">member only</p>
            <strong>글쓰기 권한이 필요하면 로그인하거나 가입하세요.</strong>
          </div>
          <label>
            <span>이메일</span>
            <input autoComplete="email" onChange={(event) => setAuthEmail(event.target.value)} type="email" value={authEmail} />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              minLength={6}
              onChange={(event) => setAuthPassword(event.target.value)}
              type="password"
              value={authPassword}
            />
          </label>
          <div className="dc-login-actions">
            <button disabled={isAuthBusy || !supabase || !authEmail || !authPassword} onClick={signIn} type="button">
              로그인
            </button>
            <button disabled={isAuthBusy || !supabase || !authEmail || authPassword.length < 6} onClick={signUp} type="button">
              가입
            </button>
          </div>
        </section>
      ) : null}

      {authMessage ? <p className="dc-status">{authMessage}</p> : null}

      {view === "list" ? renderPostList() : null}

      {view === "post" && activePost ? (
        <>
          <article className="dc-post-view">
          <header>
            <p>{activePost.category}</p>
            <h2>{activePost.title}</h2>
            <div>
              <Link className="dc-profile-link" href={getAuthorProfileHref(activePost.author)}>
                {activePost.author}
              </Link>
              <span>{formatDate(activePost.createdAt)}</span>
              <span>조회 {activePost.views}</span>
              <span>댓글 {activeReplies.length}</span>
            </div>
          </header>
          <div className="dc-post-actions">
            <button className="dc-action-button secondary" onClick={() => setView("list")} type="button">
              목록
            </button>
            <button className="dc-action-button" onClick={openWriteView} type="button">
              글쓰기
            </button>
          </div>
          <div className="dc-post-body">{activePost.body}</div>
          {activePost.tags.length ? (
            <div className="dc-tags">
              {activePost.tags.map((tag) => (
                <span key={`${activePost.id}-${tag}`}>{tag}</span>
              ))}
            </div>
          ) : null}

          <section className="dc-reply-area" aria-label="댓글">
            <h3>댓글 {activeReplies.length}</h3>
            <div className="dc-replies">
              {activeReplies.map((reply) => (
                <article key={reply.id}>
                  <Link className="dc-profile-link" href={getAuthorProfileHref(reply.author)}>
                    {reply.author}
                  </Link>
                  <p>{reply.body}</p>
                  <span>{formatDate(reply.createdAt)}</span>
                </article>
              ))}
              {!activeReplies.length ? <p className="dc-empty">아직 댓글이 없습니다.</p> : null}
            </div>
            <form className="dc-reply-form" data-disabled={!canWrite} onSubmit={submitReply}>
              <input
                disabled={!canWrite}
                onChange={(event) => setReplyForm((current) => ({ ...current, author: event.target.value }))}
                placeholder="닉네임"
                value={replyForm.author}
              />
              <textarea
                disabled={!canWrite}
                onChange={(event) => setReplyForm((current) => ({ ...current, body: event.target.value }))}
                placeholder={canWrite ? "댓글 입력" : "회원만 댓글을 쓸 수 있습니다."}
                rows={3}
                value={replyForm.body}
              />
              <button disabled={!canWrite || !replyForm.body.trim()} type="submit">
                등록
              </button>
            </form>
          </section>
          </article>
          {renderPostList("bottom")}
        </>
      ) : null}

      {view === "write" ? (
        <section className="dc-write-box" aria-label="글쓰기">
        <div className="dc-write-head">
          <div>
            <p className="dc-eyebrow">write</p>
            <h2>글쓰기</h2>
          </div>
          <div className="dc-write-head-actions">
            <span>{canWrite ? "회원 권한 확인됨" : "회원만 작성 가능"}</span>
            <button className="dc-action-button secondary" onClick={() => setView(activePost ? "post" : "list")} type="button">
              돌아가기
            </button>
          </div>
        </div>
        <form data-disabled={!canWrite} onSubmit={submitPost}>
          <div className="dc-write-grid">
            <label>
              <span>말머리</span>
              <select
                disabled={!canWrite}
                onChange={(event) =>
                  setPostForm((current) => ({
                    ...current,
                    category: isCommunityCategory(event.target.value) ? event.target.value : "잡담"
                  }))
                }
                value={postForm.category}
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
              <span>글쓴이</span>
              <input
                disabled={!canWrite}
                onChange={(event) => setPostForm((current) => ({ ...current, author: event.target.value }))}
                placeholder="닉네임"
                value={postForm.author}
              />
            </label>
          </div>
          <label>
            <span>제목</span>
            <input
              disabled={!canWrite}
              onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
              placeholder={canWrite ? "제목을 입력하세요" : "로그인 후 작성할 수 있습니다"}
              value={postForm.title}
            />
          </label>
          <label>
            <span>본문</span>
            <textarea
              disabled={!canWrite}
              onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))}
              placeholder={canWrite ? "내용을 입력하세요" : "가입한 회원만 글을 쓸 수 있습니다"}
              rows={8}
              value={postForm.body}
            />
          </label>
          <label>
            <span>태그</span>
            <input
              disabled={!canWrite}
              onChange={(event) => setPostForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="쉼표로 구분"
              value={postForm.tags}
            />
          </label>
          <button disabled={!canWrite || !postForm.title.trim() || !postForm.body.trim()} type="submit">
            등록
          </button>
        </form>
        </section>
      ) : null}
    </main>
  );
}
