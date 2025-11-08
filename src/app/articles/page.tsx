// app/articles/page.tsx
import { redirect } from "next/navigation";

export default function ArticlesRootPage() {
  redirect("/articles/page/1");
}
