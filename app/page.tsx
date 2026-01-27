/*
NOTE: Esta página redirige al login
*/

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard/invite");
}
