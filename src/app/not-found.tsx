import { buildPageMetadata } from "@/lib/page-meta";
import { NotFoundScreen } from "@/components/shared/not-found-screen";

export const metadata = buildPageMetadata({
  title: "Page not found",
  description: "This BabyBite page is not on the table. Start a meal plan for your child or return home.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return <NotFoundScreen />;
}
