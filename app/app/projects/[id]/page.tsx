import { redirect } from "next/navigation";

export default function ProjectRoot({ params }: { params: { id: string } }) {
  redirect(`/app/projects/${params.id}/today`);
}
