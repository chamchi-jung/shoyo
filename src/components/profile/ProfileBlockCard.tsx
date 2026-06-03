"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import type { MediaProfileBlock, ProfileBlock } from "@/data/sampleProfiles";
import { profileBlockTypeLabels } from "@/data/sampleProfiles";
import { YouTubeEmbed } from "./YouTubeEmbed";

type ProfileBlockCardProps = {
  block: ProfileBlock;
  commentCount?: number;
  index: number;
  onCommentClick?: (blockId: string) => void;
};

function BlockTags({ tags }: { tags?: string[] }) {
  if (!tags?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span className="taste-tag" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}

function shouldIgnoreCardClick(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, textarea, select, iframe"));
}

function getCardCommentProps(block: ProfileBlock, onCommentClick?: (blockId: string) => void) {
  if (!onCommentClick) {
    return {};
  }

  return {
    "data-commentable": "true",
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (shouldIgnoreCardClick(event.target)) {
        return;
      }

      onCommentClick(block.id);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (shouldIgnoreCardClick(event.target) || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      onCommentClick(block.id);
    },
    role: "button",
    tabIndex: 0
  } as const;
}

function CommentCue({ count }: { count?: number }) {
  return <span className="profile-comment-cue">{count ? `댓글 ${count}개` : "댓글 남기기"}</span>;
}

function MediaBlockCard({
  block,
  commentCount,
  index,
  onCommentClick
}: {
  block: MediaProfileBlock;
  commentCount?: number;
  index: number;
  onCommentClick?: (blockId: string) => void;
}) {
  return (
    <article className={`profile-block profile-block-${block.type}`} {...getCardCommentProps(block, onCommentClick)}>
      <div
        className="profile-block-cover"
        data-has-image={Boolean(block.imageUrl)}
        style={{
          background: block.imageUrl
            ? `linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.55)), url("${block.imageUrl}") center / cover`
            : `linear-gradient(135deg, ${block.coverTone[0]}, ${block.coverTone[1]})`
        }}
      >
        <b className="profile-cover-rank">#{String(index + 1).padStart(2, "0")}</b>
        <span>{block.coverLabel}</span>
        <small>{profileBlockTypeLabels[block.type]}</small>
      </div>
      <div className="profile-block-body">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="archive-label">블록 {String(index + 1).padStart(2, "0")}</p>
          <p className="profile-block-kind">{profileBlockTypeLabels[block.type]}</p>
        </div>
        <div>
          <h3 className="profile-block-title">{block.title}</h3>
          <p className="profile-block-meta">
            {block.creator} / {block.year}
          </p>
        </div>
        <p className="profile-block-note">{block.note}</p>
        <BlockTags tags={block.tags} />
        {block.link ? (
          <a className="profile-block-link" href={block.link} rel="noreferrer" target="_blank">
            원본 링크
          </a>
        ) : null}
        <CommentCue count={commentCount} />
      </div>
    </article>
  );
}

export function ProfileBlockCard({ block, commentCount, index, onCommentClick }: ProfileBlockCardProps) {
  const commentProps = getCardCommentProps(block, onCommentClick);

  if (block.type === "album" || block.type === "movie" || block.type === "book") {
    return <MediaBlockCard block={block} commentCount={commentCount} index={index} onCommentClick={onCommentClick} />;
  }

  if (block.type === "text") {
    return (
      <article className="profile-block profile-block-text" {...commentProps}>
        <div className="profile-block-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="archive-label">글 블록</p>
            <p className="profile-block-kind">글</p>
          </div>
          <h3 className="profile-block-title">{block.title}</h3>
          <p className="profile-block-longtext">{block.body}</p>
          <BlockTags tags={block.tags} />
          <CommentCue count={commentCount} />
        </div>
      </article>
    );
  }

  if (block.type === "link") {
    return (
      <article className="profile-block profile-block-link-card" {...commentProps}>
        <div className="profile-block-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="archive-label">링크 블록</p>
            <p className="profile-block-kind">링크</p>
          </div>
          <h3 className="profile-block-title">{block.title}</h3>
          <p className="profile-block-note">{block.description}</p>
          <a className="profile-block-link" href={block.url} rel="noreferrer" target="_blank">
            {block.url.replace(/^https?:\/\//, "")}
          </a>
          <BlockTags tags={block.tags} />
          <CommentCue count={commentCount} />
        </div>
      </article>
    );
  }

  if (block.type === "image") {
    return (
      <article className="profile-block profile-block-image" {...commentProps}>
        <div className="profile-single-image">
          <img alt={block.alt} className="profile-image" src={block.imageUrl} />
        </div>
        <div className="profile-block-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="archive-label">이미지 블록</p>
            <p className="profile-block-kind">이미지</p>
          </div>
          <h3 className="profile-block-title">{block.title}</h3>
          <p className="profile-block-note">{block.caption}</p>
          <BlockTags tags={block.tags} />
          <CommentCue count={commentCount} />
        </div>
      </article>
    );
  }

  if (block.type === "gallery") {
    return (
      <article className="profile-block profile-block-gallery" {...commentProps}>
        <div className="profile-gallery">
          {block.images.map((image, imageIndex) => (
            <img alt={image.alt} className="profile-image" key={`${block.id}-${image.url}-${imageIndex}`} src={image.url} />
          ))}
        </div>
        <div className="profile-block-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="archive-label">갤러리 블록</p>
            <p className="profile-block-kind">갤러리</p>
          </div>
          <h3 className="profile-block-title">{block.title}</h3>
          <p className="profile-block-note">{block.caption}</p>
          <BlockTags tags={block.tags} />
          <CommentCue count={commentCount} />
        </div>
      </article>
    );
  }

  if (block.type === "video") {
    return (
      <article className="profile-block profile-block-video" {...commentProps}>
        <YouTubeEmbed title={block.title} url={block.youtubeUrl} />
        <div className="profile-block-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="archive-label">영상 블록</p>
            <p className="profile-block-kind">유튜브</p>
          </div>
          <h3 className="profile-block-title">{block.title}</h3>
          <p className="profile-block-note">{block.description}</p>
          <BlockTags tags={block.tags} />
          <CommentCue count={commentCount} />
        </div>
      </article>
    );
  }

  if (block.type === "list") {
    const ListElement = block.ordered ? "ol" : "ul";

    return (
      <article className="profile-block profile-block-list-card" {...commentProps}>
        <div className="profile-block-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="archive-label">리스트 블록</p>
            <p className="profile-block-kind">리스트</p>
          </div>
          <h3 className="profile-block-title">{block.title}</h3>
          {block.note ? <p className="profile-block-note">{block.note}</p> : null}
          <ListElement className="profile-list-items">
            {block.items.map((item, itemIndex) => (
              <li key={`${block.id}-${item}-${itemIndex}`}>
                <span>{item}</span>
              </li>
            ))}
          </ListElement>
          <BlockTags tags={block.tags} />
          <CommentCue count={commentCount} />
        </div>
      </article>
    );
  }

  return (
    <article className="profile-block profile-block-tags" {...commentProps}>
      <div className="profile-block-body">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="archive-label">태그 블록</p>
          <p className="profile-block-kind">태그</p>
        </div>
        <h3 className="profile-block-title">{block.title}</h3>
        {block.note ? <p className="profile-block-note">{block.note}</p> : null}
        <div className="profile-tag-cloud">
          {block.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <CommentCue count={commentCount} />
      </div>
    </article>
  );
}
