import type { Metadata } from "next";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { sampleProfiles } from "@/data/sampleProfiles";
import { getPublishedProfileByUsername, getPublishedProfiles } from "@/lib/profileRepository";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export function generateStaticParams() {
  return sampleProfiles.map((profile) => ({
    username: profile.username
  }));
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublishedProfileByUsername(username);

  if (!profile) {
    return {
      title: "Profile not found"
    };
  }

  return {
    title: `${profile.nickname} / shoyo`,
    description: profile.bio
  };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const { preview } = (await searchParams) ?? {};
  const profile = await getPublishedProfileByUsername(username);
  const fallbackProfile = {
    ...sampleProfiles[0],
    username,
    nickname: username,
    heroLine: `${username}의 취향 방`,
    bio: "아직 공개 저장되지 않은 프로필입니다.",
    statusLine: "스튜디오에서 공개 저장을 기다리는 중"
  };
  const profiles = await getPublishedProfiles();

  return <ProfilePageClient allowLocalDraftPreview={preview === "draft"} initialProfile={profile ?? fallbackProfile} profiles={profiles} />;
}
