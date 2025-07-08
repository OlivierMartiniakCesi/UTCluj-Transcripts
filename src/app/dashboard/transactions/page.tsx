import DashboardSidebar from "@/components/dashboard-sidebar";
import { SubscriptionCheck } from "@/components/subscription-check";

export default function TransactionsPage() {
  return (
    <SubscriptionCheck requireSubscription={false}>
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 w-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Transactions</h1>
            <p>Historique de vos transactions.</p>
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
} 