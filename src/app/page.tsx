import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import React from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Youtube,
  FileText,
  Download,
  Globe,
  Clock,
  History,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />
      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Powerful Transcript Extraction
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Extract transcripts from YouTube content with advanced features
              designed for content creators, researchers, and businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Youtube className="w-6 h-6" />,
                title: "Bulk Processing",
                description:
                  "Extract from multiple videos, channels, and playlists simultaneously",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Multiple Formats",
                description:
                  "Export as plain text, SRT subtitles, or structured JSON",
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Language Support",
                description:
                  "Support for multiple languages and auto-detection",
              },
              {
                icon: <Download className="w-6 h-6" />,
                title: "Easy Export",
                description: "Copy to clipboard or download files instantly",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-red-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple 3-step process to extract transcripts from any YouTube
              content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Paste YouTube URL</h3>
              <p className="text-gray-600">
                Enter video, channel, or playlist URLs into our intuitive
                interface
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Configure Options</h3>
              <p className="text-gray-600">
                Select output format, language preferences, and processing
                options
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Results</h3>
              <p className="text-gray-600">
                Get your transcripts with copy-to-clipboard and download options
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-20 bg-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-red-100">Videos Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-red-100">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-red-100">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your transcript extraction needs. No
              hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Extract Transcripts?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators, researchers, and businesses who
            trust our transcript extraction service.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Start Extracting Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>
      <Footer />
      <div className="w-[696px] h-[113px]"></div>
    </div>
  );
}
