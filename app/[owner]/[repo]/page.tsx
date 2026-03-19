import { authOptions } from "@/auth";
import { PagePanel, PageShell } from "@/components/layout/page-shell";
import AuthorizedDomainsFields from "@/components/repo/authorized-domains-fields";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
};

export default async function RepositorySettingsPage({ params }: PageProps) {
  const { owner, repo } = await params;

  if (!owner || !repo) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    redirect("/");
  }

  const fullName = `${owner}/${repo}`;
  const existing = await prisma.repositoryConfig.findUnique({
    where: {
      userId_fullName: {
        userId: user.id,
        fullName,
      },
    },
    select: { authorizedDomains: true },
  });

  const domains =
    Array.isArray(existing?.authorizedDomains) &&
    existing.authorizedDomains.every((entry) => typeof entry === "string")
      ? (existing.authorizedDomains as string[])
      : [];

  async function saveAuthorizedDomains(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) redirect("/");

    const authorizedDomains = formData
      .getAll("authorizedDomains")
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean);

    await prisma.repositoryConfig.upsert({
      where: {
        userId_fullName: {
          userId: user.id,
          fullName,
        },
      },
      create: {
        userId: user.id,
        owner,
        repo,
        fullName,
        authorizedDomains,
      },
      update: {
        authorizedDomains,
      },
    });

    redirect(`/${owner}/${repo}`);
  }

  return (
    <PageShell>
      <PagePanel>
        <div className="mb-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Repository</p>
          <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
        </div>

        <form action={saveAuthorizedDomains} className="space-y-4">
          <AuthorizedDomainsFields initialDomains={domains} />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Save
            </button>
            <Link
              href="/"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Back to dashboard
            </Link>
          </div>
        </form>
      </PagePanel>
    </PageShell>
  );
}
