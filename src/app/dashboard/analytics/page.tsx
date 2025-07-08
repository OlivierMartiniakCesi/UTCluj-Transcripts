import DashboardSidebar from "@/components/dashboard-sidebar";
import { SubscriptionCheck } from "@/components/subscription-check";

export default function AnalyticsPage() {
  return (
    <SubscriptionCheck requireSubscription={false}>
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 w-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Analytics</h1>
            <p>Statistiques d'utilisation de votre compte.</p>
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
} 