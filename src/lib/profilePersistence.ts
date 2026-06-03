import type { SupabaseClient } from "@supabase/supabase-js";
import type { GalleryProfileBlock, ImageProfileBlock, MediaProfileBlock, Profile, ProfileBlock } from "@/data/sampleProfiles";
import { getSupabaseBrowserClient } from "./supabase";

const PROFILE_IMAGE_BUCKET = "profile-images";
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{2,31}$/;

type UserProfileRow = {
  profile: Profile;
};

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

export function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateUsername(username: string) {
  const normalized = normalizeUsername(username);

  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error("username은 영문 소문자, 숫자, 하이픈으로 3-32자여야 합니다.");
  }

  return normalized;
}

function isImageDataUrl(value?: string): value is string {
  return Boolean(value?.startsWith("data:image/"));
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/svg+xml") {
    return "svg";
  }

  return mimeType.replace("image/", "") || "png";
}

async function hashText(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const bytes = Array.from(new Uint8Array(digest.slice(0, 8)));

  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function uploadDataUrl(supabase: SupabaseClient, userId: string, username: string, label: string, dataUrl?: string) {
  if (!isImageDataUrl(dataUrl)) {
    return dataUrl ?? "";
  }

  const imageDataUrl = dataUrl;
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const extension = extensionFromMimeType(blob.type);
  const hash = await hashText(imageDataUrl);
  const storagePath = `${userId}/${username}/${label}-${hash}.${extension}`;
  const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).upload(storagePath, blob, {
    contentType: blob.type,
    upsert: true
  });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  return supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function uploadProfileImages(supabase: SupabaseClient, userId: string, profile: Profile) {
  const nextProfile = cloneProfile(profile);

  nextProfile.avatarUrl = await uploadDataUrl(supabase, userId, nextProfile.username, "avatar", nextProfile.avatarUrl);
  nextProfile.coverImageUrl = await uploadDataUrl(supabase, userId, nextProfile.username, "cover", nextProfile.coverImageUrl);
  nextProfile.theme.backgroundImage = await uploadDataUrl(
    supabase,
    userId,
    nextProfile.username,
    "background",
    nextProfile.theme.backgroundImage
  );

  nextProfile.blocks = await Promise.all(
    nextProfile.blocks.map(async (block, blockIndex): Promise<ProfileBlock> => {
      if (block.type === "album" || block.type === "movie" || block.type === "book") {
        const mediaBlock: MediaProfileBlock = {
          ...block,
          imageUrl: block.imageUrl
            ? await uploadDataUrl(supabase, userId, nextProfile.username, `block-${blockIndex}-cover`, block.imageUrl)
            : undefined
        };

        return mediaBlock;
      }

      if (block.type === "image") {
        const imageBlock: ImageProfileBlock = {
          ...block,
          imageUrl: await uploadDataUrl(supabase, userId, nextProfile.username, `block-${blockIndex}-image`, block.imageUrl)
        };

        return imageBlock;
      }

      if (block.type === "gallery") {
        const galleryBlock: GalleryProfileBlock = {
          ...block,
          images: await Promise.all(
            block.images.map(async (image, imageIndex) => ({
              ...image,
              url: await uploadDataUrl(supabase, userId, nextProfile.username, `block-${blockIndex}-gallery-${imageIndex}`, image.url)
            }))
          )
        };

        return galleryBlock;
      }

      return block;
    })
  );

  return nextProfile;
}

export async function loadMyPublishedProfile() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 아직 설정되지 않았습니다.");
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase.from("profiles").select("profile").eq("user_id", user.id).maybeSingle<UserProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.profile || !isProfile(data.profile)) {
    return null;
  }

  return data.profile;
}

export async function saveMyPublishedProfile(profile: Profile) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 아직 설정되지 않았습니다.");
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const normalizedUsername = validateUsername(profile.username);
  const profileWithUsername = {
    ...profile,
    username: normalizedUsername
  };
  const uploadedProfile = await uploadProfileImages(supabase, user.id, profileWithUsername);
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      username: uploadedProfile.username,
      profile: uploadedProfile
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return uploadedProfile;
}
