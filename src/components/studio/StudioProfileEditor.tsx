"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ProfileShell } from "@/components/profile/ProfileShell";
import type { Profile, ProfileBlock, ProfileCardStyle, ProfileLayout, ProfileLink, ProfilePreset } from "@/data/sampleProfiles";
import { profilePresets, sampleProfiles } from "@/data/sampleProfiles";
import { isLocalImageDataUrl, readImageFile } from "@/lib/localImage";
import { StudioAccountPanel } from "./StudioAccountPanel";
import { StudioBlockEditor } from "./StudioBlockEditor";
import { reorderBlocksByPreset, StudioThemeEditor } from "./StudioThemeEditor";

const STORAGE_KEY = "shoyo:studio-profile";
const quickWallpapers = [
  { label: "밤 방", value: "/samples/midnight-room.svg", size: "cover" },
  { label: "진 벽", value: "/samples/basement-zine.svg", size: "cover" },
  { label: "파스텔 책상", value: "/samples/pastel-desk.svg", size: "cover" },
  { label: "옛 홈페이지", value: "/samples/old-homepage.svg", size: "tile" },
  { label: "없음", value: "", size: "cover" }
] as const;
const quickAccents = ["#dfb95e", "#e2779b", "#23a6a6", "#d56042", "#7c3f35"];
const quickCardStyles = ["paper", "outline", "tape", "glass"] satisfies ProfileCardStyle[];
const cardStyleLabels = {
  paper: "종이",
  outline: "테두리",
  tape: "테이프",
  glass: "유리"
} satisfies Record<ProfileCardStyle, string>;
const layoutLabels = {
  shelf: "선반형",
  zine: "진형",
  room: "방형",
  homepage: "홈페이지형"
} satisfies Record<ProfileLayout, string>;

function cloneProfile(profile: Profile) {
  return JSON.parse(JSON.stringify(profile)) as Profile;
}

function isProfile(value: unknown): value is Profile {
  const candidate = value as Partial<Profile>;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      typeof candidate.username === "string" &&
      typeof candidate.nickname === "string" &&
      Array.isArray(candidate.blocks) &&
      candidate.theme &&
      typeof candidate.theme === "object"
  );
}

function listToText(values: string[]) {
  return values.join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function linksToText(values: ProfileLink[]) {
  return values.map((item) => `${item.label}|${item.url}`).join("\n");
}

function textToLinks(value: string): ProfileLink[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|");
      return {
        label: label?.trim() || "link",
        url: url?.trim() || "https://example.com"
      };
    });
}

type EditorSectionProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  eyebrow: string;
  title: string;
};

function EditorSection({ children, defaultOpen = false, eyebrow, title }: EditorSectionProps) {
  return (
    <details className="studio-panel" open={defaultOpen}>
      <summary className="studio-panel-summary">
        <span>
          <p className="studio-eyebrow">{eyebrow}</p>
          <h2 className="studio-heading">{title}</h2>
        </span>
      </summary>
      <div className="mt-4 grid gap-4">{children}</div>
    </details>
  );
}

export function StudioProfileEditor() {
  const [profile, setProfile] = useState(() => cloneProfile(sampleProfiles[0]));
  const [saveStatus, setSaveStatus] = useState("초안");
  const [importJson, setImportJson] = useState("");
  const [selectedCanvasBlockId, setSelectedCanvasBlockId] = useState(sampleProfiles[0].blocks[0]?.id ?? "");
  const hasHydratedDraftRef = useRef(false);
  const lastSavedDraftRef = useRef("");
  const skipNextAutoSaveRef = useRef(false);

  function persistLocalDraft(nextProfile: Profile, status = "로컬에 저장했습니다") {
    try {
      const profileJson = JSON.stringify(nextProfile);

      window.localStorage.setItem(STORAGE_KEY, profileJson);
      lastSavedDraftRef.current = profileJson;
      setSaveStatus(status);
      return true;
    } catch {
      setSaveStatus("자동 저장 실패: 이미지가 너무 큽니다. 더 작은 사진으로 다시 넣어주세요.");
      return false;
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const savedProfile = window.localStorage.getItem(STORAGE_KEY);

      if (!savedProfile) {
        hasHydratedDraftRef.current = true;
        return;
      }

      try {
        const parsedProfile = JSON.parse(savedProfile) as unknown;

        if (isProfile(parsedProfile)) {
          lastSavedDraftRef.current = savedProfile;
          setProfile(parsedProfile);
          setSelectedCanvasBlockId(parsedProfile.blocks[0]?.id ?? "");
          setSaveStatus("저장된 로컬 초안을 불러왔습니다");
          hasHydratedDraftRef.current = true;
          return;
        }

        setSaveStatus("저장된 초안이 shoyo 프로필 형식이 아닙니다");
      } catch {
        setSaveStatus("초안");
      } finally {
        hasHydratedDraftRef.current = true;
      }
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) {
      return undefined;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return undefined;
    }

    const handle = window.setTimeout(() => {
      const profileJson = JSON.stringify(profile);

      if (profileJson === lastSavedDraftRef.current) {
        return;
      }

      persistLocalDraft(profile, "자동 저장됨");
    }, 600);

    return () => window.clearTimeout(handle);
  }, [profile]);

  function updateProfile(recipe: (draft: Profile) => void) {
    setProfile((current) => {
      const draft = cloneProfile(current);
      recipe(draft);
      return draft;
    });
    setSaveStatus("저장되지 않은 변경사항");
  }

  function replaceProfile(nextProfile: Profile) {
    setProfile(cloneProfile(nextProfile));
    setSelectedCanvasBlockId(nextProfile.blocks[0]?.id ?? "");
  }

  function saveLocalDraft() {
    persistLocalDraft(profile);
  }

  function saveBeforePreview() {
    persistLocalDraft(profile, "미리보기용 초안을 저장했습니다");
  }

  function clearLocalDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    lastSavedDraftRef.current = "";
    skipNextAutoSaveRef.current = true;
    setProfile(cloneProfile(sampleProfiles[0]));
    setSelectedCanvasBlockId(sampleProfiles[0].blocks[0]?.id ?? "");
    setSaveStatus("샘플로 초기화했습니다");
  }

  function loadSample(username: string) {
    const nextProfile = sampleProfiles.find((item) => item.username === username);

    if (!nextProfile) {
      return;
    }

    setProfile(cloneProfile(nextProfile));
    setSelectedCanvasBlockId(nextProfile.blocks[0]?.id ?? "");
    setSaveStatus("샘플 방을 불러왔습니다");
  }

  function applyPreset(preset: ProfilePreset) {
    updateProfile((draft) => {
      draft.selectedPreset = preset.slug;
      draft.layout = preset.layout;
      draft.theme = { ...preset.theme };
      draft.blocks = reorderBlocksByPreset(draft, preset.blockOrder);
    });
    setSelectedCanvasBlockId(profile.blocks[0]?.id ?? "");
    setSaveStatus(`프리셋 적용: ${preset.label}`);
  }

  function moveCanvasBlock(fromIndex: number, insertIndex: number) {
    if (fromIndex === insertIndex || fromIndex + 1 === insertIndex) {
      return;
    }

    updateProfile((draft) => {
      const [movingBlock] = draft.blocks.splice(fromIndex, 1);

      if (!movingBlock) {
        return;
      }

      const nextIndex = fromIndex < insertIndex ? insertIndex - 1 : insertIndex;
      draft.blocks.splice(nextIndex, 0, movingBlock);
    });
  }

  function updateCanvasBlock(index: number, block: ProfileBlock) {
    updateProfile((draft) => {
      draft.blocks[index] = block;
    });
    setSelectedCanvasBlockId(block.id);
  }

  function handleBackgroundFile(file: File | undefined) {
    void readImageFile(file)
      .then((image) => {
        if (!image) {
          return;
        }

        updateProfile((draft) => {
          draft.theme.backgroundImage = image.dataUrl;
          draft.theme.backgroundSize = "cover";
          draft.theme.slug = "custom-local";
        });
        setSaveStatus(`${image.name} 배경 이미지를 적용했습니다`);
      })
      .catch((error: Error) => setSaveStatus(error.message));
  }

  function handleProfileImageFile(field: "avatarUrl" | "coverImageUrl", file: File | undefined) {
    void readImageFile(file)
      .then((image) => {
        if (!image) {
          return;
        }

        updateProfile((draft) => {
          draft[field] = image.dataUrl;
        });
        setSaveStatus(`${image.name} 이미지를 적용했습니다`);
      })
      .catch((error: Error) => setSaveStatus(error.message));
  }

  function exportProfileJson() {
    const json = JSON.stringify(profile, null, 2);
    setImportJson(json);

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => undefined);
    }

    setSaveStatus("프로필 JSON을 내보냈습니다");
  }

  function importProfileJson() {
    try {
      const parsed = JSON.parse(importJson) as unknown;

      if (!isProfile(parsed)) {
        setSaveStatus("가져오기 실패: shoyo 프로필 JSON이 아닙니다");
        return;
      }

      setProfile(parsed);
      setSaveStatus("프로필 JSON을 가져왔습니다");
    } catch {
      setSaveStatus("가져오기 실패: JSON 형식이 올바르지 않습니다");
    }
  }

  return (
    <main className="studio-shell">
      <div className="studio-editor">
        <header className="studio-toolbar">
          <div>
            <p className="studio-eyebrow">shoyo 스튜디오</p>
            <h1 className="studio-title">프로필 만들기</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="studio-button" onClick={saveLocalDraft} type="button">
              초안 저장
            </button>
            <a className="studio-button secondary" href={`/profile/${profile.username}?preview=draft`} onClick={saveBeforePreview}>
              페이지 미리보기
            </a>
            <button className="studio-button secondary" onClick={clearLocalDraft} type="button">
              초기화
            </button>
          </div>
        </header>

        <p className="studio-status">{saveStatus}</p>

        <section className="studio-image-board" aria-label="프로필 대표 이미지 바꾸기">
          <div className="studio-image-board-copy">
            <p className="studio-eyebrow">사진 바꾸기</p>
            <h2>프로필 사진과 방 대표 이미지를 바로 교체하세요.</h2>
          </div>
          <div className="studio-image-upload-grid">
            <label className="studio-image-upload-card">
              <span
                aria-hidden="true"
                className="studio-image-upload-preview avatar"
                style={{ backgroundImage: `url("${profile.avatarUrl}")` }}
              />
              <span className="studio-image-upload-copy">
                <strong>프로필 사진</strong>
                <small>왼쪽 위 주인장 카드에 들어가는 작은 사진</small>
              </span>
              <span className="studio-image-upload-action">이미지 선택</span>
              <input
                accept="image/*"
                className="studio-image-file-input"
                onChange={(event) => handleProfileImageFile("avatarUrl", event.target.files?.[0])}
                type="file"
              />
              {isLocalImageDataUrl(profile.avatarUrl) ? <em>직접 고른 이미지 사용 중</em> : null}
            </label>
            <label className="studio-image-upload-card">
              <span
                aria-hidden="true"
                className="studio-image-upload-preview cover"
                style={{ backgroundImage: `url("${profile.coverImageUrl}")` }}
              />
              <span className="studio-image-upload-copy">
                <strong>방 대표 이미지</strong>
                <small>주인장 카드 상단과 큰 방 창 배경에 보이는 이미지</small>
              </span>
              <span className="studio-image-upload-action">이미지 선택</span>
              <input
                accept="image/*"
                className="studio-image-file-input"
                onChange={(event) => handleProfileImageFile("coverImageUrl", event.target.files?.[0])}
                type="file"
              />
              {isLocalImageDataUrl(profile.coverImageUrl) ? <em>직접 고른 이미지 사용 중</em> : null}
            </label>
          </div>
        </section>

        <StudioAccountPanel
          onLoadProfile={replaceProfile}
          onSaveProfile={replaceProfile}
          onStatus={setSaveStatus}
          onUpdateProfile={updateProfile}
          profile={profile}
        />

        <section className="studio-builder-deck" aria-label="빌더 빠른 설정">
          <div className="studio-builder-copy">
            <p className="studio-eyebrow">바로 완성도 올리기</p>
            <h2>분위기를 고르고, 방처럼 배치하세요.</h2>
          </div>
          <div className="studio-template-rail" aria-label="비주얼 프리셋">
            {profilePresets.map((preset) => (
              <button
                className="studio-template-card"
                data-active={profile.selectedPreset === preset.slug}
                key={preset.slug}
                onClick={() => applyPreset(preset)}
                style={
                  {
                    "--preset-bg": preset.theme.background,
                    "--preset-paper": preset.theme.paper,
                    "--preset-accent": preset.theme.accent,
                    "--preset-border": preset.theme.border
                  } as CSSProperties
                }
                type="button"
              >
                <span />
                <strong>{preset.label}</strong>
                <small>{layoutLabels[preset.layout]}</small>
              </button>
            ))}
          </div>
          <div className="studio-starter-strip" aria-label="시작용 샘플 방">
            <div>
              <p className="studio-eyebrow">샘플 방</p>
              <strong>완성된 프로필을 불러와서 바꿔보세요.</strong>
            </div>
            <div className="studio-starter-grid">
              {sampleProfiles.map((starter) => (
                <button
                  className="studio-starter-card"
                  key={starter.username}
                  onClick={() => loadSample(starter.username)}
                  style={
                    {
                      "--starter-bg": starter.theme.background,
                      "--starter-paper": starter.theme.paper,
                      "--starter-accent": starter.theme.accent,
                      "--starter-border": starter.theme.border
                    } as CSSProperties
                  }
                  type="button"
                >
                  <span />
                  <strong>{starter.nickname}</strong>
                  <small>@{starter.username}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="studio-quick-decor" aria-label="빠른 꾸미기">
            <div>
              <p className="studio-eyebrow">배경화면</p>
              <div className="studio-wallpaper-row">
                {quickWallpapers.map((wallpaper) => (
                  <button
                    key={wallpaper.label}
                    onClick={() =>
                      updateProfile((draft) => {
                        draft.theme.backgroundImage = wallpaper.value;
                        draft.theme.backgroundSize = wallpaper.size;
                        draft.theme.slug = "custom-local";
                      })
                    }
                    type="button"
                  >
                    {wallpaper.label}
                  </button>
                ))}
              </div>
              <label className="studio-field mt-3">
                <span>내 이미지 선택</span>
                <input accept="image/*" onChange={(event) => handleBackgroundFile(event.target.files?.[0])} type="file" />
                {isLocalImageDataUrl(profile.theme.backgroundImage) ? <small className="studio-file-note">선택한 이미지 파일 사용 중</small> : null}
              </label>
            </div>
            <div>
              <p className="studio-eyebrow">강조색</p>
              <div className="studio-accent-row">
                {quickAccents.map((accent) => (
                  <button
                    aria-label={`${accent} 강조색 사용`}
                    key={accent}
                    onClick={() =>
                      updateProfile((draft) => {
                        draft.theme.accent = accent;
                        draft.theme.slug = "custom-local";
                      })
                    }
                    style={{ background: accent }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="studio-eyebrow">카드</p>
              <div className="studio-card-style-row">
                {quickCardStyles.map((cardStyle) => (
                  <button
                    data-active={profile.theme.cardStyle === cardStyle}
                    key={cardStyle}
                    onClick={() =>
                      updateProfile((draft) => {
                        draft.theme.cardStyle = cardStyle;
                        draft.theme.slug = "custom-local";
                      })
                    }
                    type="button"
                  >
                    {cardStyleLabels[cardStyle]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <EditorSection defaultOpen eyebrow="블록" title="블록 추가, 이동, 삭제">
          <StudioBlockEditor onUpdate={updateProfile} profile={profile} />
        </EditorSection>

        <EditorSection eyebrow="샘플" title="샘플 방 불러오기">
          <label className="studio-field">
            <span>프로필</span>
            <select onChange={(event) => loadSample(event.target.value)} value="">
              <option value="">샘플 선택</option>
              {sampleProfiles.map((item) => (
                <option key={item.username} value={item.username}>
                  {item.nickname} / @{item.username}
                </option>
              ))}
            </select>
          </label>
        </EditorSection>

        <EditorSection eyebrow="기본 정보" title="이름과 소개">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="studio-field">
              <span>사용자 이름</span>
              <input
                onChange={(event) =>
                  updateProfile((draft) => {
                    draft.username = event.target.value;
                  })
                }
                value={profile.username}
              />
            </label>
            <label className="studio-field">
              <span>닉네임</span>
              <input
                onChange={(event) =>
                  updateProfile((draft) => {
                    draft.nickname = event.target.value;
                  })
                }
                value={profile.nickname}
              />
            </label>
          </div>

          <label className="studio-field">
            <span>대표 문장</span>
            <input
              onChange={(event) =>
                updateProfile((draft) => {
                  draft.heroLine = event.target.value;
                })
              }
              value={profile.heroLine}
            />
          </label>

          <label className="studio-field">
            <span>소개글</span>
            <textarea
              onChange={(event) =>
                updateProfile((draft) => {
                  draft.bio = event.target.value;
                })
              }
              rows={4}
              value={profile.bio}
            />
          </label>

          <label className="studio-field">
            <span>현재 상태</span>
            <input
              onChange={(event) =>
                updateProfile((draft) => {
                  draft.statusLine = event.target.value;
                })
              }
              value={profile.statusLine}
            />
          </label>

          <label className="studio-field">
            <span>무드 태그</span>
            <input
              onChange={(event) =>
                updateProfile((draft) => {
                  draft.curationTags = textToList(event.target.value);
                })
              }
              value={listToText(profile.curationTags)}
            />
          </label>

          <label className="studio-field">
            <span>프로필 링크, 한 줄에 하나: 이름|주소</span>
            <textarea
              onChange={(event) =>
                updateProfile((draft) => {
                  draft.profileLinks = textToLinks(event.target.value);
                })
              }
              rows={3}
              value={linksToText(profile.profileLinks)}
            />
          </label>
        </EditorSection>

        <EditorSection eyebrow="스타일" title="템플릿과 테마">
          <StudioThemeEditor onApplyPreset={applyPreset} onUpdate={updateProfile} presets={profilePresets} profile={profile} />
        </EditorSection>

        <EditorSection eyebrow="오브젝트" title="방 안의 물건">
          {profile.pinnedObjects.map((object, index) => (
            <div className="studio-item" key={`${object.label}-${index}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="studio-field">
                  <span>라벨</span>
                  <input
                    onChange={(event) =>
                      updateProfile((draft) => {
                        draft.pinnedObjects[index].label = event.target.value;
                      })
                    }
                    value={object.label}
                  />
                </label>
                <label className="studio-field">
                  <span>제목</span>
                  <input
                    onChange={(event) =>
                      updateProfile((draft) => {
                        draft.pinnedObjects[index].title = event.target.value;
                      })
                    }
                    value={object.title}
                  />
                </label>
              </div>
              <label className="studio-field">
                <span>메모</span>
                <textarea
                  onChange={(event) =>
                    updateProfile((draft) => {
                      draft.pinnedObjects[index].note = event.target.value;
                    })
                  }
                  rows={2}
                  value={object.note}
                />
              </label>
            </div>
          ))}
        </EditorSection>

        <EditorSection eyebrow="가져오기/내보내기" title="프로필 JSON">
          <div className="flex flex-wrap gap-2">
            <button className="studio-button" onClick={exportProfileJson} type="button">
              JSON 내보내기
            </button>
            <button className="studio-button secondary" onClick={importProfileJson} type="button">
              JSON 가져오기
            </button>
          </div>
          <label className="studio-field">
            <span>JSON 입력칸</span>
            <textarea onChange={(event) => setImportJson(event.target.value)} rows={7} value={importJson} />
          </label>
        </EditorSection>
      </div>

      <aside className="studio-preview">
        <div className="studio-preview-bar">
          <div>
            <p className="studio-eyebrow">실시간 미리보기</p>
            <h2>{profile.nickname}</h2>
            <small>카드를 클릭하면 이 창 안에서 바로 편집할 수 있습니다.</small>
          </div>
          <div className="studio-window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <a href={`/profile/${profile.username}?preview=draft`} onClick={saveBeforePreview}>
            페이지 미리보기
          </a>
        </div>
        <div className="studio-preview-frame">
          <ProfileShell
            blockEditor={{
              selectedBlockId: selectedCanvasBlockId,
              onMoveBlock: moveCanvasBlock,
              onSelectBlock: setSelectedCanvasBlockId,
              onUpdateBlock: updateCanvasBlock
            }}
            preview
            profile={profile}
            profiles={sampleProfiles}
          />
        </div>
      </aside>
    </main>
  );
}
