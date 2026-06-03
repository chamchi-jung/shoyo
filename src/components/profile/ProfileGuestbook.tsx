"use client";

import { useEffect, useMemo, useState } from "react";
import type { Profile, ProfileComment } from "@/data/sampleProfiles";
import { createGuestbookComment, fetchGuestbookComments } from "@/lib/profileComments";
import { ProfileCommentForm, ProfileCommentList } from "./ProfileCommentThread";

type ProfileGuestbookProps = {
  preview?: boolean;
  profile: Profile;
};

function getGuestbookStorageKey(username: string) {
  return `shoyo:guestbook:${username}`;
}

function readStoredComments(username: string) {
  try {
    const saved = window.localStorage.getItem(getGuestbookStorageKey(username));
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is ProfileComment => {
      const comment = item as Partial<ProfileComment>;

      return Boolean(
        comment &&
          typeof comment.id === "string" &&
          typeof comment.author === "string" &&
          typeof comment.body === "string" &&
          typeof comment.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function ProfileGuestbook({ preview = false, profile }: ProfileGuestbookProps) {
  const [localComments, setLocalComments] = useState<ProfileComment[]>([]);
  const [remoteComments, setRemoteComments] = useState<ProfileComment[]>([]);
  const [storageMode, setStorageMode] = useState<"local" | "remote">("local");
  const savedComments = storageMode === "remote" ? remoteComments : localComments;
  const comments = useMemo(() => [...(profile.guestbook ?? []), ...savedComments], [profile.guestbook, savedComments]);

  useEffect(() => {
    if (preview) {
      return;
    }

    let isActive = true;
    const handle = window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setLocalComments(readStoredComments(profile.username));
      setStorageMode("local");

      void fetchGuestbookComments(profile.username)
        .then((commentsFromServer) => {
          if (!isActive || !commentsFromServer) {
            return;
          }

          setRemoteComments(commentsFromServer);
          setStorageMode("remote");
        })
        .catch(() => undefined);
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(handle);
    };
  }, [preview, profile.username]);

  function saveLocalComment(comment: ProfileComment) {
    setLocalComments((current) => {
      const nextComments = [...current, comment];

      try {
        window.localStorage.setItem(getGuestbookStorageKey(profile.username), JSON.stringify(nextComments));
      } catch {
        return current;
      }

      return nextComments;
    });
  }

  async function addComment(comment: ProfileComment) {
    if (storageMode !== "remote") {
      saveLocalComment(comment);
      return;
    }

    try {
      const savedComment = await createGuestbookComment(profile.username, comment);

      if (!savedComment) {
        saveLocalComment(comment);
        setStorageMode("local");
        return;
      }

      setRemoteComments((current) => [...current, savedComment]);
    } catch {
      saveLocalComment(comment);
      setStorageMode("local");
    }
  }

  return (
    <section className="profile-guestbook" aria-label="프로필 방명록">
      <div className="profile-guestbook-heading">
        <div>
          <p className="archive-label mb-3">방명록</p>
          <h2>다녀간 사람들이 붙인 쪽지</h2>
        </div>
        <span>{comments.length}개</span>
      </div>
      <ProfileCommentList comments={comments} emptyText="아직 붙은 쪽지가 없습니다. 첫 방문 흔적을 남겨보세요." />
      <ProfileCommentForm disabled={preview} onSubmit={addComment} submitLabel="방명록 남기기" />
    </section>
  );
}
