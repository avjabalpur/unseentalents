import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-client";
import type { Topic } from "@/types/api";
import { TopicView } from "@/components/shared/TopicView";

async function getTopic(key: string): Promise<Topic | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/topics/${key}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Topic;
}

export default async function TopicPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const topic = await getTopic(key);
  if (!topic) notFound();

  return <TopicView topic={topic} />;
}
