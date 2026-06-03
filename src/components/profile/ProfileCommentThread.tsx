"use client";

import { type FormEvent, useState } from "react";
import type { ProfileComment } from "@/data/sampleProfiles";

type ProfileCommentFormProps = {
  disabled?: boolean;
  onSubmit: (comment: ProfileComment) => Promise<void> | void;
  submitLabel: string;
};

type ProfileCommentListProps = {
  comments: ProfileComment[];
  emptyText: string;
};

function createCommentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCommentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function createProfileComment(author: string, body: string): ProfileComment {
  return {
    id: createCommentId(),
    author: author.trim() || "이름 없는 방문자",
    body: body.trim(),
    createdAt: new Date().toISOString()
  };
}

export function ProfileCommentList({ comments, emptyText }: ProfileCommentListProps) {
  if (!comments.length) {
    return <p className="profile-comment-empty">{emptyText}</p>;
  }

  return (
    <div className="profile-comment-list">
      {comments.map((comment) => (
        <article className="profile-comment-item" key={comment.id}>
          <div>
            <strong>{comment.author}</strong>
            <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
          </div>
          <p>{comment.body}</p>
        </article>
      ))}
    </div>
  );
}

export function ProfileCommentForm({ disabled = false, onSubmit, submitLabel }: ProfileCommentFormProps) {
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLocked = disabled || isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked || !body.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(createProfileComment(author, body));
      setBody("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form aria-busy={isSubmitting} className="profile-comment-form" onSubmit={handleSubmit}>
      <div className="profile-comment-form-grid">
        <label>
          <span>이름</span>
          <input
            disabled={isLocked}
            maxLength={24}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="방문자"
            value={author}
          />
        </label>
        <label>
          <span>메모</span>
          <textarea
            disabled={isLocked}
            maxLength={280}
            onChange={(event) => setBody(event.target.value)}
            placeholder={disabled ? "미리보기에서는 댓글을 저장하지 않습니다." : "짧은 댓글을 남겨보세요."}
            rows={3}
            value={body}
          />
        </label>
      </div>
      <button disabled={isLocked || !body.trim()} type="submit">
        {isSubmitting ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
