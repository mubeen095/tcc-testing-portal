import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PhotoCapture } from "@/components/candidate/PhotoCapture";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Candidate Photo" };

export default async function CandidatePhotoPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role === "ADMIN") redirect("/admin");
  return <PhotoCapture />;
}