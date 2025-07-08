import { createClient } from '../../supabase/client'

export interface TranscriptionRequest {
  url: string
  language?: string
  format?: 'txt' | 'srt' | 'json'
}

export interface TranscriptionResult {
  id: string
  title: string
  url: string
  transcript: string
  duration: string
  language: string
  videoId?: string
}

export interface TranscriptionResponse {
  success: boolean
  data?: {
    transcript: string
    duration: number
    language: string
    title: string
    videoId?: string
  }
  error?: string
}

class TranscriptionService {
  private supabase = createClient()

  async transcribeUrl(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const { url, language = 'auto', format = 'txt' } = request

    // Determine if it's a YouTube URL
    const isYouTube = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url)
    
    // Extract video ID for YouTube URLs
    const videoId = isYouTube ? this.extractVideoId(url) : null
    
    try {
      // Try to call the Supabase function first
      const functionName = isYouTube ? 'transcribe-youtube' : 'transcribe-url'
      
      const { data, error } = await this.supabase.functions.invoke(functionName, {
        body: {
          url,
          language,
          format
        }
      })

      if (error) {
        console.warn('Supabase function failed:', error.message)
        
        // Check if it's a quota error
        if (error.message.includes('Quota OpenAI dépassé') || error.message.includes('Too Many Requests')) {
          throw new Error('Quota OpenAI dépassé. Veuillez attendre ou vérifier votre quota sur https://platform.openai.com/usage')
        }
        
        // Check if it's a configuration error
        if (error.message.includes('Clé OpenAI invalide')) {
          throw new Error('Configuration OpenAI invalide. Vérifiez votre clé API.')
        }
        
        // For other errors, fall back to demo mode
        throw new Error('Function not deployed or error occurred')
      }

      const response = data as TranscriptionResponse
      
      if (!response.success) {
        throw new Error(response.error || 'Transcription failed')
      }

      if (!response.data) {
        throw new Error('No transcription data received')
      }

      // Convert duration from seconds to MM:SS format
      const duration = this.formatDuration(response.data.duration)

      return {
        id: response.data.videoId || Date.now().toString(),
        title: response.data.title,
        url,
        transcript: response.data.transcript,
        duration,
        language: response.data.language,
        videoId: response.data.videoId
      }
    } catch (error) {
      // Fallback to demo mode if function is not deployed
      console.log(error)
      throw error
    }
  }

  async transcribeMultipleUrls(requests: TranscriptionRequest[]): Promise<TranscriptionResult[]> {
    const results: TranscriptionResult[] = []
    
    for (const request of requests) {
      try {
        const result = await this.transcribeUrl(request)
        results.push(result)
      } catch (error) {
        console.error(`Failed to transcribe ${request.url}:`, error)
        // Continue with other URLs even if one fails
      }
    }
    
    return results
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Helper method to validate URLs
  validateUrl(url: string): { isValid: boolean; type: 'youtube' | 'video' | 'audio' | 'unknown' } {
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    const videoRegex = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i
    const audioRegex = /\.(mp3|wav|flac|aac|ogg|m4a)$/i
    
    if (youtubeRegex.test(url)) {
      return { isValid: true, type: 'youtube' }
    }
    
    if (videoRegex.test(url)) {
      return { isValid: true, type: 'video' }
    }
    
    if (audioRegex.test(url)) {
      return { isValid: true, type: 'audio' }
    }
    
    // Check if it's a valid URL
    try {
      new URL(url)
      return { isValid: true, type: 'unknown' }
    } catch {
      return { isValid: false, type: 'unknown' }
    }
  }

  // Helper method to extract video ID from YouTube URL
  extractVideoId(url: string): string | null {
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
}

export const transcriptionService = new TranscriptionService() 