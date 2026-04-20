import { redirect } from "next/navigation";

export default function BriefsRedirectPage() {
  redirect("/?tab=briefs");
}
