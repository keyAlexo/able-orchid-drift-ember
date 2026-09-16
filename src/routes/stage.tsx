import { createFileRoute } from "@tanstack/react-router";
import { StageScreen } from "@/components/bible/StageScreen";

export const Route = createFileRoute("/stage")({ component: StagePage });

function StagePage() {
  return (
    <main className="stage-page">
      <StageScreen />
    </main>
  );
}
