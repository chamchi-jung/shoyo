import type { Metadata } from "next";
import { StudioProfileEditor } from "@/components/studio/StudioProfileEditor";

export const metadata: Metadata = {
  title: "Profile Studio / shoyo",
  description: "A local block editor for shaping a personal shoyo taste page."
};

export default function StudioProfilePage() {
  return <StudioProfileEditor />;
}
