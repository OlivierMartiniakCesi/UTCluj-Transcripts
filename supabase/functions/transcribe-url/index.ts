// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptionRequest {
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
    title?: string
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
    const { url, language = 'auto', format = 'txt' }: TranscriptionRequest = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate URL
    const urlPattern = /^https?:\/\/.+/i
    if (!urlPattern.test(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
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

    // Step 1: Download the video/audio file
    console.log('Downloading media from URL:', url)
    let mediaUrl = url
    let title = 'Unknown Title'

    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'YouTube URLs require additional processing. Please provide a direct audio/video URL or use our YouTube-specific endpoint.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Download the file as a blob
    const mediaResponse = await fetch(mediaUrl)
    if (!mediaResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download media file.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    const mediaBlob = await mediaResponse.blob()

    // Step 3: Upload the file to AssemblyAI
    console.log('Uploading file to AssemblyAI...')
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
    const audio_url = uploadData.upload_url

    // Step 4: Request transcription
    console.log('Requesting transcription from AssemblyAI...')
    const transcriptReqBody: any = {
      audio_url,
      language_code: language !== 'auto' ? language : undefined,
      speaker_labels: false,
      auto_chapters: false,
      punctuate: true,
      format_text: true,
      // Add more options if needed
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

    // Step 5: Poll for transcription completion
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

    // Step 6: Format the response based on requested format
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
        duration: finalData.audio_duration,
        language: finalData.language_code,
        title
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
    console.error('Error in transcribe-url function:', error)
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

// formatTime function is not needed for AssemblyAI SRT 