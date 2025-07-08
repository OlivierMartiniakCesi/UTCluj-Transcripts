"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Youtube,
  FileText,
  Download,
  Copy,
  Play,
  List,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link,
  Video,
  Music,
} from "lucide-react";
import { transcriptionService, TranscriptionResult } from "../lib/transcription-service";

type TranscriptFormat = "txt" | "srt" | "json";
type ProcessingStatus = "idle" | "processing" | "completed" | "error";

interface TranscriptResult {
  id: string;
  title: string;
  url: string;
  transcript: string;
  duration: string;
  language: string;
}

export default function TranscribeForm() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<TranscriptFormat>("txt");
  const [language, setLanguage] = useState("auto");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TranscriptResult[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("input");



  const validateUrl = (url: string): { isValid: boolean; type: string } => {
    return transcriptionService.validateUrl(url);
  };

  const getUrlType = (url: string): "video" | "playlist" | "channel" | "audio" | "unknown" => {
    const validation = validateUrl(url);
    if (validation.type === 'youtube') {
      if (url.includes("playlist")) return "playlist";
      if (url.includes("channel") || url.includes("@")) return "channel";
      return "video";
    }
    if (validation.type === 'audio') return "audio";
    if (validation.type === 'video') return "video";
    return "unknown";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Veuillez entrer une URL");
      return;
    }

    const validation = validateUrl(url);
    if (!validation.isValid) {
      setError("URL invalide. Veuillez vérifier le format.");
      return;
    }

    setError("");
    setStatus("processing");
    setProgress(0);
    setActiveTab("progress");

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      // Call the transcription service
      const result = await transcriptionService.transcribeUrl({
        url: url.trim(),
        language: language === 'auto' ? undefined : language,
        format
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResults([result]);
      setStatus("completed");
      setActiveTab("results");

    } catch (error) {
      console.error('Transcription error:', error);
      setError(error instanceof Error ? error.message : "Erreur lors de la transcription");
      setStatus("error");
      setActiveTab("input");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadTranscript = (result: TranscriptResult) => {
    let content = result.transcript;
    let filename = `${result.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${format}`;
    let mimeType = "text/plain";

    if (format === "srt") {
      content = `1\n00:00:00,000 --> 00:00:05,000\n${result.transcript.substring(0, 100)}...\n\n2\n00:00:05,000 --> 00:00:10,000\n${result.transcript.substring(100, 200)}...`;
      mimeType = "application/x-subrip";
    } else if (format === "json") {
      content = JSON.stringify(
        {
          title: result.title,
          url: result.url,
          duration: result.duration,
          language: result.language,
          transcript: result.transcript,
        },
        null,
        2,
      );
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setUrl("");
    setStatus("idle");
    setProgress(0);
    setResults([]);
    setError("");
    setActiveTab("input");
  };

  return (
    <Card className="shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            disabled={status === "idle"}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Progression
          </TabsTrigger>
          <TabsTrigger
            value="results"
            disabled={results.length === 0}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Résultats
          </TabsTrigger>
        </TabsList>

        {/* Input Tab */}
        <TabsContent value="input">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600" />
              URL Vidéo/Audio
            </CardTitle>
            <CardDescription>
              Entrez l'URL d'une vidéo YouTube, fichier audio ou vidéo pour extraire
              les transcriptions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium">
                  URL Vidéo/Audio *
                </Label>
                <div className="relative">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... ou https://example.com/audio.mp3"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    disabled={status === "processing"}
                  />
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                                  {url && (
                    <div className="flex items-center gap-2 text-sm">
                      {getUrlType(url) === "video" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          Vidéo
                        </Badge>
                      )}
                      {getUrlType(url) === "playlist" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <List className="w-3 h-3" />
                          Playlist
                        </Badge>
                      )}
                      {getUrlType(url) === "channel" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Youtube className="w-3 h-3" />
                          Chaîne
                        </Badge>
                      )}
                      {getUrlType(url) === "audio" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Music className="w-3 h-3" />
                          Audio
                        </Badge>
                      )}
                      {getUrlType(url) === "unknown" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Link className="w-3 h-3" />
                          URL
                        </Badge>
                      )}
                    </div>
                  )}
              </div>

              {/* Format Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format" className="text-sm font-medium">
                    Format de sortie
                  </Label>
                  <Select
                    value={format}
                    onValueChange={(value: TranscriptFormat) =>
                      setFormat(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="txt">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Texte brut (.txt)
                        </div>
                      </SelectItem>
                      <SelectItem value="srt">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Sous-titres (.srt)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          JSON structuré (.json)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Langue
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Détection automatique
                        </div>
                      </SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="es">Espagnol</SelectItem>
                      <SelectItem value="de">Allemand</SelectItem>
                      <SelectItem value="it">Italien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={status === "processing"}
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extraction en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Commencer l'extraction
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Extraction en cours
            </CardTitle>
            <CardDescription>
              Veuillez patienter pendant que nous extrayons les transcriptions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="text-center text-gray-600">
              {progress < 30 && "Analyse de l'URL..."}
              {progress >= 30 &&
                progress < 60 &&
                "Récupération des métadonnées..."}
              {progress >= 60 &&
                progress < 90 &&
                "Extraction des transcriptions..."}
              {progress >= 90 && "Finalisation..."}
            </div>
          </CardContent>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Transcriptions extraites
            </CardTitle>
            <CardDescription>
              {results.length} transcription(s) extraite(s) avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((result, index) => (
              <Card key={result.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{result.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {result.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {result.language.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.transcript)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript(result)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.transcript}
                    readOnly
                    className="min-h-[120px] resize-none"
                  />
                </CardContent>
              </Card>
            ))}

            <Separator />

            <div className="flex justify-center">
              <Button variant="outline" onClick={resetForm}>
                Nouvelle extraction
              </Button>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
