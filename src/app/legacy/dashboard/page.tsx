import { redirect } from "next/navigation";

/** Legacy dashboard — funnel users should use /results instead. */
export default function LegacyDashboardPage() {
  redirect("/results");
}
