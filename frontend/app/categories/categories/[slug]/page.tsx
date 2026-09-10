import { redirect } from "next/navigation";

export default async function DuplicateCategoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/categories/${slug}`);
}
