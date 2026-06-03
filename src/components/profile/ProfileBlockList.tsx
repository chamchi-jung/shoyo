"use client";

import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import type { MediaProfileBlock, ProfileBlock, ProfileComment } from "@/data/sampleProfiles";
import { profileBlockTypeLabels } from "@/data/sampleProfiles";
import { createBlockComment, fetchBlockComments } from "@/lib/profileComments";
import { ProfileBlockCard } from "./ProfileBlockCard";
import { ProfileCommentForm, ProfileCommentList } from "./ProfileCommentThread";

type ProfileBlockListProps = {
  blocks: ProfileBlock[];
  preview?: boolean;
  username: string;
};

function isMediaBlock(block: ProfileBlock): block is MediaProfileBlock {
  return block.type === "album" || block.type === "movie" || block.type === "book";
}

function getBlockCommentStorageKey(username: string) {
  return `shoyo:block-comments:${username}`;
}

function isProfileComment(value: unknown): value is ProfileComment {
  const comment = value as Partial<ProfileComment>;

  return Boolean(
    comment &&
      typeof comment.id === "string" &&
      typeof comment.author === "string" &&
      typeof comment.body === "string" &&
      typeof comment.createdAt === "string"
  );
}

function readStoredBlockComments(username: string) {
  try {
    const saved = window.localStorage.getItem(getBlockCommentStorageKey(username));
    const parsed = saved ? (JSON.parse(saved) as unknown) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, ProfileComment[]>>((comments, [blockId, value]) => {
      if (Array.isArray(value)) {
        comments[blockId] = value.filter(isProfileComment);
      }

      return comments;
    }, {});
  } catch {
    return {};
  }
}

function getBlockTitle(block: ProfileBlock) {
  return block.title ?? profileBlockTypeLabels[block.type];
}

export function ProfileBlockList({ blocks, preview = false, username }: ProfileBlockListProps) {
  const topShelfBlocks = blocks.filter(isMediaBlock).slice(0, 4);
  const [localCommentsByBlock, setLocalCommentsByBlock] = useState<Record<string, ProfileComment[]>>({});
  const [remoteCommentsByBlock, setRemoteCommentsByBlock] = useState<Record<string, ProfileComment[]>>({});
  const [storageMode, setStorageMode] = useState<"local" | "remote">("local");
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const savedCommentsByBlock = storageMode === "remote" ? remoteCommentsByBlock : localCommentsByBlock;
  const activeBlock = useMemo(() => blocks.find((block) => block.id === activeBlockId) ?? null, [activeBlockId, blocks]);
  const activeBlockComments = activeBlock ? [...(activeBlock.comments ?? []), ...(savedCommentsByBlock[activeBlock.id] ?? [])] : [];

  useEffect(() => {
    if (preview) {
      return;
    }

    let isActive = true;
    const handle = window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setLocalCommentsByBlock(readStoredBlockComments(username));
      setStorageMode("local");

      void fetchBlockComments(username)
        .then((commentsFromServer) => {
          if (!isActive || !commentsFromServer) {
            return;
          }

          setRemoteCommentsByBlock(commentsFromServer);
          setStorageMode("remote");
        })
        .catch(() => undefined);
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(handle);
    };
  }, [preview, username]);

  useEffect(() => {
    if (!activeBlock) {
      return undefined;
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveBlockId(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeBlock]);

  function getBlockCommentCount(block: ProfileBlock) {
    return (block.comments?.length ?? 0) + (savedCommentsByBlock[block.id]?.length ?? 0);
  }

  function saveLocalBlockComment(blockId: string, comment: ProfileComment) {
    setLocalCommentsByBlock((current) => {
      const nextComments = {
        ...current,
        [blockId]: [...(current[blockId] ?? []), comment]
      };

      try {
        window.localStorage.setItem(getBlockCommentStorageKey(username), JSON.stringify(nextComments));
      } catch {
        return current;
      }

      return nextComments;
    });
  }

  async function addBlockComment(comment: ProfileComment) {
    if (!activeBlock) {
      return;
    }

    if (storageMode !== "remote") {
      saveLocalBlockComment(activeBlock.id, comment);
      return;
    }

    try {
      const savedComment = await createBlockComment(username, activeBlock.id, comment);

      if (!savedComment) {
        saveLocalBlockComment(activeBlock.id, comment);
        setStorageMode("local");
        return;
      }

      setRemoteCommentsByBlock((current) => ({
        ...current,
        [activeBlock.id]: [...(current[activeBlock.id] ?? []), savedComment]
      }));
    } catch {
      saveLocalBlockComment(activeBlock.id, comment);
      setStorageMode("local");
    }
  }

  function handleShelfKeyDown(event: KeyboardEvent<HTMLElement>, block: ProfileBlock) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    setActiveBlockId(block.id);
  }

  return (
    <section className="profile-block-list" aria-label="프로필 취향 블록">
      <div className="profile-block-list-heading mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--profile-border)] pb-3">
        <div>
          <p className="archive-label mb-2">취향 블록</p>
          <h2 className="text-2xl font-black leading-none sm:text-3xl">취향을 이루는 조각들</h2>
        </div>
        <p className="font-mono text-xs uppercase text-[var(--profile-muted)]">
          {blocks.length.toString().padStart(2, "0")}개 블록
        </p>
      </div>

      {topShelfBlocks.length ? (
        <div className="profile-top-shelf" aria-label="좋아하는 취향 오브젝트">
          {topShelfBlocks.map((block, index) => (
            <article
              className="top-shelf-card"
              key={block.id}
              onClick={() => setActiveBlockId(block.id)}
              onKeyDown={(event) => handleShelfKeyDown(event, block)}
              role="button"
              style={{
                backgroundImage: block.imageUrl
                  ? `linear-gradient(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.48)), url("${block.imageUrl}")`
                  : `linear-gradient(135deg, ${block.coverTone[0]}, ${block.coverTone[1]})`
              }}
              tabIndex={0}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{profileBlockTypeLabels[block.type]}</small>
              <strong>{block.title}</strong>
              <em>{getBlockCommentCount(block) ? `댓글 ${getBlockCommentCount(block)}` : "댓글 열기"}</em>
            </article>
          ))}
        </div>
      ) : null}

      <div className="profile-block-grid">
        {blocks.map((block, index) => (
          <ProfileBlockCard
            block={block}
            commentCount={getBlockCommentCount(block)}
            index={index}
            key={block.id}
            onCommentClick={setActiveBlockId}
          />
        ))}
      </div>

      {activeBlock ? (
        <div className="profile-comment-overlay" onClick={() => setActiveBlockId(null)} role="presentation">
          <aside
            aria-labelledby="profile-block-comment-title"
            aria-modal="true"
            className="profile-comment-drawer"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="profile-comment-drawer-heading">
              <div>
                <p className="archive-label mb-3">카드 댓글</p>
                <h3 id="profile-block-comment-title">{getBlockTitle(activeBlock)}</h3>
                <p>{profileBlockTypeLabels[activeBlock.type]} 카드에 붙은 방문 메모</p>
              </div>
              <button aria-label="댓글창 닫기" onClick={() => setActiveBlockId(null)} type="button">
                닫기
              </button>
            </div>
            <ProfileCommentList comments={activeBlockComments} emptyText="아직 이 카드에 붙은 댓글이 없습니다." />
            <ProfileCommentForm disabled={preview} onSubmit={addBlockComment} submitLabel="카드에 댓글 남기기" />
          </aside>
        </div>
      ) : null}
    </section>
  );
}
