import { authOptions } from "@/auth";
import DashboardView from "@/components/home/dashboard-view";
import LandingView from "@/components/home/landing-view";
import { getInstallationRepositories } from "@/lib/github-app";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type InstalledRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  pushed_at?: string;
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <LandingView />;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      githubAppInstalled: true,
      githubInstallationId: true,
    },
  });

  if (!user?.githubAppInstalled || !user.githubInstallationId) {
    redirect("/api/github/install");
  }

  let repos: InstalledRepo[] = [];
  let repositoriesError: string | undefined;
  try {
    repos = await getInstallationRepositories(user.githubInstallationId);
  } catch (error) {
    repositoriesError =
      error instanceof Error ? error.message : "Failed to load repositories.";
  }
  const manageAccessUrl = `https://github.com/settings/installations/${user.githubInstallationId}`;

  return (
    <DashboardView
      repositories={repos}
      manageAccessUrl={manageAccessUrl}
      repositoriesError={repositoriesError}
    />
  );
}
