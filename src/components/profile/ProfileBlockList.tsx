"use client";

import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import type { ListProfileBlock, MediaProfileBlock, ProfileBlock, ProfileComment } from "@/data/sampleProfiles";
import { profileBlockTypeLabels } from "@/data/sampleProfiles";
import { isLocalImageDataUrl, readImageFile, readImageFiles } from "@/lib/localImage";
import { createBlockComment, fetchBlockComments } from "@/lib/profileComments";
import { ProfileBlockCard } from "./ProfileBlockCard";
import { ProfileCommentForm, ProfileCommentList } from "./ProfileCommentThread";

type ProfileBlockListProps = {
  blocks: ProfileBlock[];
  editor?: ProfileBlockListEditor;
  preview?: boolean;
  username: string;
};

type ProfileBlockListEditor = {
  selectedBlockId: string;
  onDuplicateBlock: (index: number) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  onRemoveBlock: (index: number) => void;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock: (index: number, block: ProfileBlock) => void;
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

function listToText(values?: string[]) {
  return values?.join(", ") ?? "";
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function linesToText(values?: string[]) {
  return values?.join("\n") ?? "";
}

function textToLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function InlineListFields({ block, onReplace }: { block: ListProfileBlock; onReplace: (block: ProfileBlock) => void }) {
  const [itemsText, setItemsText] = useState(() => linesToText(block.items));

  function updateItems(nextText: string) {
    setItemsText(nextText);
    onReplace({ ...block, items: textToLines(nextText) });
  }

  return (
    <>
      <label>
        <span>제목</span>
        <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
      </label>
      <label>
        <span>항목</span>
        <textarea onChange={(event) => updateItems(event.target.value)} rows={6} value={itemsText} />
      </label>
      <label>
        <span>메모</span>
        <textarea onChange={(event) => onReplace({ ...block, note: event.target.value })} rows={2} value={block.note ?? ""} />
      </label>
      <label>
        <span>태그</span>
        <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
      </label>
    </>
  );
}

function InlineBlockFields({ block, onReplace }: { block: ProfileBlock; onReplace: (block: ProfileBlock) => void }) {
  if (block.type === "text") {
    return (
      <>
        <label>
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label>
          <span>본문</span>
          <textarea onChange={(event) => onReplace({ ...block, body: event.target.value })} rows={5} value={block.body} />
        </label>
        <label>
          <span>태그</span>
          <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
        </label>
      </>
    );
  }

  if (block.type === "link") {
    return (
      <>
        <label>
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label>
          <span>링크 주소</span>
          <input onChange={(event) => onReplace({ ...block, url: event.target.value })} value={block.url} />
        </label>
        <label>
          <span>설명</span>
          <textarea onChange={(event) => onReplace({ ...block, description: event.target.value })} rows={3} value={block.description} />
        </label>
        <label>
          <span>태그</span>
          <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
        </label>
      </>
    );
  }

  if (block.type === "list") {
    return <InlineListFields block={block} key={block.id} onReplace={onReplace} />;
  }

  if (block.type === "album" || block.type === "movie" || block.type === "book") {
    const mediaBlock = block;

    function handleCoverFile(file: File | undefined) {
      void readImageFile(file)
        .then((image) => {
          if (!image) {
            return;
          }

          onReplace({ ...mediaBlock, imageUrl: image.dataUrl });
        })
        .catch(() => undefined);
    }

    return (
      <>
        <label>
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...mediaBlock, title: event.target.value })} value={mediaBlock.title} />
        </label>
        <label>
          <span>제작자</span>
          <input onChange={(event) => onReplace({ ...mediaBlock, creator: event.target.value })} value={mediaBlock.creator} />
        </label>
        <label>
          <span>커버 사진 첨부</span>
          <input accept="image/*" onChange={(event) => handleCoverFile(event.target.files?.[0])} type="file" />
          {mediaBlock.imageUrl && isLocalImageDataUrl(mediaBlock.imageUrl) ? <small>선택한 사진 사용 중</small> : null}
        </label>
        <label>
          <span>커버 이미지 주소</span>
          <input onChange={(event) => onReplace({ ...mediaBlock, imageUrl: event.target.value })} value={mediaBlock.imageUrl ?? ""} />
        </label>
        <label>
          <span>메모</span>
          <textarea onChange={(event) => onReplace({ ...mediaBlock, note: event.target.value })} rows={3} value={mediaBlock.note} />
        </label>
        <label>
          <span>원본 링크</span>
          <input onChange={(event) => onReplace({ ...mediaBlock, link: event.target.value })} value={mediaBlock.link ?? ""} />
        </label>
      </>
    );
  }

  if (block.type === "video") {
    return (
      <>
        <label>
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label>
          <span>유튜브 주소</span>
          <input onChange={(event) => onReplace({ ...block, youtubeUrl: event.target.value })} value={block.youtubeUrl} />
        </label>
        <label>
          <span>설명</span>
          <textarea onChange={(event) => onReplace({ ...block, description: event.target.value })} rows={3} value={block.description} />
        </label>
      </>
    );
  }

  if (block.type === "image") {
    const imageBlock = block;

    function handleImageFile(file: File | undefined) {
      void readImageFile(file)
        .then((image) => {
          if (!image) {
            return;
          }

          onReplace({ ...imageBlock, imageUrl: image.dataUrl, alt: imageBlock.alt || image.name });
        })
        .catch(() => undefined);
    }

    return (
      <>
        <label>
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...imageBlock, title: event.target.value })} value={imageBlock.title} />
        </label>
        <label>
          <span>사진 첨부</span>
          <input accept="image/*" onChange={(event) => handleImageFile(event.target.files?.[0])} type="file" />
          {isLocalImageDataUrl(imageBlock.imageUrl) ? <small>선택한 사진 사용 중</small> : null}
        </label>
        <label>
          <span>이미지 주소</span>
          <input onChange={(event) => onReplace({ ...imageBlock, imageUrl: event.target.value })} value={imageBlock.imageUrl} />
        </label>
        <label>
          <span>대체 텍스트</span>
          <input onChange={(event) => onReplace({ ...imageBlock, alt: event.target.value })} value={imageBlock.alt} />
        </label>
        <label>
          <span>캡션</span>
          <textarea onChange={(event) => onReplace({ ...imageBlock, caption: event.target.value })} rows={3} value={imageBlock.caption} />
        </label>
      </>
    );
  }

  if (block.type === "gallery") {
    const galleryBlock = block;

    function handleGalleryFiles(files: FileList | null | undefined) {
      void readImageFiles(files)
        .then((images) => {
          if (!images.length) {
            return;
          }

          onReplace({
            ...galleryBlock,
            images: images.map((image, index) => ({
              url: image.dataUrl,
              alt: galleryBlock.images[index]?.alt || image.name
            }))
          });
        })
        .catch(() => undefined);
    }

    const firstImage = galleryBlock.images[0] ?? { url: "", alt: "" };

    return (
      <>
        <label>
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...galleryBlock, title: event.target.value })} value={galleryBlock.title} />
        </label>
        <label>
          <span>갤러리 사진 첨부</span>
          <input accept="image/*" multiple onChange={(event) => handleGalleryFiles(event.target.files)} type="file" />
          {galleryBlock.images.some((image) => isLocalImageDataUrl(image.url)) ? <small>{galleryBlock.images.length}장 선택한 사진 사용 중</small> : null}
        </label>
        <label>
          <span>첫 이미지 주소</span>
          <input
            onChange={(event) =>
              onReplace({
                ...galleryBlock,
                images: [{ ...firstImage, url: event.target.value }, ...galleryBlock.images.slice(1)]
              })
            }
            value={firstImage.url}
          />
        </label>
        <label>
          <span>캡션</span>
          <textarea onChange={(event) => onReplace({ ...galleryBlock, caption: event.target.value })} rows={3} value={galleryBlock.caption} />
        </label>
      </>
    );
  }

  return (
    <>
      <label>
        <span>제목</span>
        <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
      </label>
      <label>
        <span>태그</span>
        <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
      </label>
      <label>
        <span>메모</span>
        <textarea onChange={(event) => onReplace({ ...block, note: event.target.value })} rows={2} value={block.note ?? ""} />
      </label>
    </>
  );
}

function InlineBlockEditor({
  block,
  canMoveDown,
  canMoveUp,
  index,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onReplace
}: {
  block: ProfileBlock;
  canMoveDown: boolean;
  canMoveUp: boolean;
  index: number;
  onDuplicateBlock: (index: number) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  onRemoveBlock: (index: number) => void;
  onReplace: (block: ProfileBlock) => void;
}) {
  return (
    <div className="studio-inline-block-editor" onClick={(event) => event.stopPropagation()}>
      <div className="studio-inline-editor-head">
        <div>
          <p className="archive-label">캔버스 편집</p>
          <strong>
            #{String(index + 1).padStart(2, "0")} / {profileBlockTypeLabels[block.type]}
          </strong>
        </div>
        <div>
          <button disabled={!canMoveUp} onClick={() => onMoveBlock(index, index - 1)} type="button">
            위로
          </button>
          <button disabled={!canMoveDown} onClick={() => onMoveBlock(index, index + 2)} type="button">
            아래로
          </button>
          <button onClick={() => onDuplicateBlock(index)} type="button">
            복사
          </button>
          <button data-danger="true" onClick={() => onRemoveBlock(index)} type="button">
            삭제
          </button>
        </div>
      </div>
      <div className="studio-inline-fields">
        <InlineBlockFields block={block} onReplace={onReplace} />
      </div>
    </div>
  );
}

export function ProfileBlockList({ blocks, editor, preview = false, username }: ProfileBlockListProps) {
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
    if (editor) {
      editor.onSelectBlock(block.id);
      return;
    }

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
              onClick={() => {
                if (editor) {
                  editor.onSelectBlock(block.id);
                  return;
                }

                setActiveBlockId(block.id);
              }}
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
              <em>{editor ? "편집하기" : getBlockCommentCount(block) ? `댓글 ${getBlockCommentCount(block)}` : "댓글 열기"}</em>
            </article>
          ))}
        </div>
      ) : null}

      <div className="profile-block-grid">
        {blocks.map((block, index) => {
          const isEditing = editor?.selectedBlockId === block.id;

          return (
            <ProfileBlockCard
              block={block}
              commentCount={editor ? undefined : getBlockCommentCount(block)}
              editorControls={
                editor && isEditing ? (
                  <InlineBlockEditor
                    block={block}
                    canMoveDown={index < blocks.length - 1}
                    canMoveUp={index > 0}
                    index={index}
                    onDuplicateBlock={editor.onDuplicateBlock}
                    onMoveBlock={editor.onMoveBlock}
                    onRemoveBlock={editor.onRemoveBlock}
                    onReplace={(nextBlock) => editor.onUpdateBlock(index, nextBlock)}
                  />
                ) : null
              }
              index={index}
              isEditing={isEditing}
              key={block.id}
              onCommentClick={editor ? undefined : setActiveBlockId}
              onEditSelect={editor?.onSelectBlock}
            />
          );
        })}
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
