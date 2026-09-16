import { createRoot } from "react-dom/client";
import { StageScreen } from "@/components/bible/StageScreen";

createRoot(document.getElementById("root")!).render(
  <main className="stage-page">
    <StageScreen />
  </main>,
);
