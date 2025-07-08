import DashboardSidebar from "@/components/dashboard-sidebar";
import { createClient } from "../../../supabase/server";
import { InfoIcon, UserCircle, CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <SubscriptionCheck requireSubscription={false}>
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 w-full">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            {/* Header Section */}
            <header className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
                <InfoIcon size="14" />
                <span>This is a protected page only visible to authenticated users</span>
              </div>
            </header>

            {/* User Profile Section */}
            <section className="bg-card rounded-xl p-6 border shadow-sm max-w-xl">
              <div className="flex items-center gap-4 mb-6">
                <UserCircle size={48} className="text-primary" />
                <div>
                  <h2 className="font-semibold text-xl">Profil utilisateur</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Nom</span>
                  <div className="font-medium">{user.user_metadata?.full_name || user.email}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Email</span>
                  <div className="font-medium">{user.email}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Créé le</span>
                  <div className="font-medium">{formatDate(user.created_at)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Dernière connexion</span>
                  <div className="font-medium">{formatDate(user.last_sign_in_at)}</div>
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Email confirmé</span>
                  {user.email_confirmed_at ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> Oui</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> Non</span>
                  )}
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-xs text-muted-foreground">ID utilisateur</span>
                  <div className="font-mono text-xs break-all">{user.id}</div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
}
