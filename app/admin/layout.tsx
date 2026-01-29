import { redirect } from "next/navigation";
import { getUserFromRequest } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromRequest();
  
  // Redirect if not logged in
  if (!user) {
    redirect("/auth/login");
  }
  
  // Redirect if not admin
  if (!user.isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
