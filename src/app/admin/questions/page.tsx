import type { Metadata } from "next";
import { QuestionsManager } from "@/components/admin/QuestionsManager";

export const metadata: Metadata = { title: "Questions" };
export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  return <QuestionsManager />;
}