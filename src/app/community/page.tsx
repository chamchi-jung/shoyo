import type { Metadata } from "next";
import Link from "next/link";
import { CommunityBoard } from "@/components/community/CommunityBoard";

export const metadata: Metadata = {
  title: "shoyo 자유게시판",
  description: "프로필과 취향 이야기를 가볍게 남기는 shoyo 자유게시판"
};

export default function CommunityPage() {
  return (
    <>
      <nav className="community-nav" aria-label="커뮤니티 이동">
        <Link href="/">shoyo 홈</Link>
        <Link href="/studio/profile">내 프로필 만들기</Link>
      </nav>
      <CommunityBoard />
    </>
  );
}
