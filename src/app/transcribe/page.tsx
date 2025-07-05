import ClientNavbar from "@/components/client-navbar";
import TranscribeForm from "@/components/transcribe-form";
import { Youtube } from "lucide-react";

export default function TranscribePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <ClientNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-red-100 rounded-full">
                <Youtube className="w-6 h-6 text-red-600" />
                <span className="text-red-800 font-medium">
                  Extracteur de Transcriptions
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Extraire les Transcriptions YouTube
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transformez vos vidéos, playlists et chaînes YouTube en texte avec
              notre outil d'extraction en masse.
            </p>
          </div>

          {/* Main Content */}
          <TranscribeForm />
        </div>
      </div>
    </div>
  );
}
