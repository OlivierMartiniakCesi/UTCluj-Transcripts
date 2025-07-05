import Link from "next/link";
import { ArrowUpRight, Check, Youtube, FileText, Download } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3 px-6 py-3 bg-red-100 rounded-full">
                <Youtube className="w-6 h-6 text-red-600" />
                <span className="text-red-800 font-medium">
                  YouTube Transcript Extractor
                </span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Extract{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                Transcripts
              </span>{" "}
              from YouTube in Bulk
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform YouTube videos, channels, and playlists into text with
              our powerful bulk transcript extraction tool. Support for multiple
              formats and languages.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-lg font-medium"
              >
                Start Extracting
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-gray-600">
                  Multiple formats: TXT, SRT, JSON
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <Youtube className="w-5 h-5" />
                </div>
                <span className="text-gray-600">
                  Videos, channels & playlists
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-gray-600">
                  Bulk processing & download
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
