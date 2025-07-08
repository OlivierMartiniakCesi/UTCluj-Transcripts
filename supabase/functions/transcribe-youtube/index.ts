// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface YouTubeTranscriptionRequest {
  url: string
  language?: string
  format?: 'txt' | 'srt' | 'json'
}

interface TranscriptionResponse {
  success: boolean
  data?: {
    transcript: string
    duration: number
    language: string
    title: string
    videoId: string
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { url, language = 'auto', format = 'txt' }: YouTubeTranscriptionRequest = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    if (!youtubeRegex.test(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid YouTube URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract video ID
    const videoId = extractVideoId(url)
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract video ID from URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get AssemblyAI API key from environment
    const assemblyApiKey = Deno.env.get('ASSEMBLYAI_API_KEY')
    if (!assemblyApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AssemblyAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Get video metadata using YouTube Data API
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    let title = 'Unknown Title'
    let duration = 0

    if (youtubeApiKey) {
      try {
        const metadataResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${youtubeApiKey}`
        )
        
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json()
          if (metadata.items && metadata.items.length > 0) {
            title = metadata.items[0].snippet.title
            // Parse duration (ISO 8601 format)
            const durationStr = metadata.items[0].contentDetails.duration
            duration = parseDuration(durationStr)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch video metadata:', error)
      }
    }

    // Step 2: Extract audio from YouTube video
    const ytDlpServiceUrl = Deno.env.get('YTDLP_SERVICE_URL')
    if (!ytDlpServiceUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'YTDLP_SERVICE_URL not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    const audioRes = await fetch(`${ytDlpServiceUrl}/audio?videoId=${videoId}`);
    let audioData;
    try {
      audioData = await audioRes.json();
    } catch (e) {
      audioData = {};
    }

    if (!audioRes.ok || !audioData.audioUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: audioData.error || 'yt-dlp service error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const audioUrl = audioData.audioUrl;

    // Step 3: Download the audio file
    const mediaResponse = await fetch(audioUrl)
    if (!mediaResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download audio file.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    const mediaBlob = await mediaResponse.blob()

    // Step 4: Upload the file to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': assemblyApiKey
      },
      body: mediaBlob
    })
    if (!uploadRes.ok) {
      const errorData = await uploadRes.text()
      console.error('AssemblyAI upload error:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload file to AssemblyAI.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    const uploadData = await uploadRes.json()
    const assemblyAudioUrl = uploadData.upload_url

    // Step 5: Request transcription
    const transcriptReqBody: any = {
      audio_url: assemblyAudioUrl,
      language_code: language !== 'auto' ? language : undefined,
      speaker_labels: false,
      auto_chapters: false,
      punctuate: true,
      format_text: true,
    }
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': assemblyApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(transcriptReqBody)
    })
    if (!transcriptRes.ok) {
      const errorData = await transcriptRes.text()
      console.error('AssemblyAI transcript error:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to start transcription with AssemblyAI.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    const transcriptData = await transcriptRes.json()
    const transcriptId = transcriptData.id

    // Step 6: Poll for transcription completion
    let status = transcriptData.status
    let pollCount = 0
    const maxPolls = 60 // up to 5 minutes
    let finalData = transcriptData
    while (status !== 'completed' && status !== 'error' && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // wait 5s
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'authorization': assemblyApiKey
        }
      })
      finalData = await pollRes.json()
      status = finalData.status
      pollCount++
    }

    if (status !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, error: 'Transcription failed or timed out.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 7: Format the response based on requested format
    let transcript = finalData.text
    let formattedTranscript = transcript
    if (format === 'srt') {
      // SRT from AssemblyAI
      const srtRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}/srt`, {
        headers: {
          'authorization': assemblyApiKey
        }
      })
      formattedTranscript = await srtRes.text()
    } else if (format === 'json') {
      formattedTranscript = JSON.stringify({
        title,
        url,
        videoId,
        duration: finalData.audio_duration,
        language: finalData.language_code,
        transcript: finalData.text,
        utterances: finalData.utterances,
        words: finalData.words
      }, null, 2)
    }

    const response: TranscriptionResponse = {
      success: true,
      data: {
        transcript: formattedTranscript,
        duration: finalData.audio_duration || duration || 120,
        language: finalData.language_code,
        title,
        videoId,
        url,        // Ajout de l'url reçue
        input_language: language, // Ajout de la langue reçue
        input_format: format      // Ajout du format reçu
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in transcribe-youtube function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration format (PT1H2M3S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
} 