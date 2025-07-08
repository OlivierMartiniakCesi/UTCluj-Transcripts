import DashboardSidebar from "@/components/dashboard-sidebar";
import { SubscriptionCheck } from "@/components/subscription-check";
import TranscribeForm from "@/components/transcribe-form";

export default function TranscribePage() {
  return (
    <SubscriptionCheck requireSubscription={false}>
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 w-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Transcribe</h1>
            <p>Déposez vos fichiers audio ou vidéo ici pour les transcrire.</p>
            <div className="mt-10">
              <TranscribeForm />
            </div>
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
}
