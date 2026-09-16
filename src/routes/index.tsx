import { createFileRoute } from "@tanstack/react-router";
import { PisanieApp } from "@/components/bible/PisanieApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PisanieApp />;
}
