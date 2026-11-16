import { ChatPanel } from "@/components/chat-panel";
import { getLlmProvider } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function Home() {
  return <ChatPanel provider={getLlmProvider()} />;
}
