import { CandidateNavbar } from "@/components/candidate/CandidateNavbar";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <CandidateNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}