import { redirect } from "next/navigation";

export default async function BibliotekaSzczegolyPage({ params }: PageProps<"/biblioteka/[id]">) {
  const { id } = await params;
  redirect(`/innowacje/${id}`);
}
