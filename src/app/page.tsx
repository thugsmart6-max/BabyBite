import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForUser } from "@/lib/funnel-gates";

export default async function Home() {
  const session = await auth();
  redirect(
    homePathForUser({
      isLoggedIn: Boolean(session?.user),
      onboardingComplete: Boolean(session?.user?.onboardingComplete),
      hasPaid: Boolean(session?.user?.hasPaid),
    })
  );
}
