import { ProfileForm } from "@/components/profile-form";
import { getProfile } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Profile
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          The agent uses this to search, score matches, and draft cover letters.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <ProfileForm
          initial={{
            name: profile.name,
            targetRoles: profile.targetRoles,
            skills: profile.skills,
            locations: profile.locations,
            remoteOk: profile.remoteOk,
            salaryMin: profile.salaryMin,
            resumeText: profile.resumeText,
          }}
        />
      </div>
    </div>
  );
}
