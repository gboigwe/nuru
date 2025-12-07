# Voice Recognition Services

Production-ready voice recognition system with multi-tier fallback.

## Architecture

### Tier 1: Web Speech API (Primary)
Browser-native, zero-cost, low-latency solution.

**Features:**
- Real-time transcription
- Voice Activity Detection (VAD)
- Confidence scoring
- Auto-stop on silence (2s)
- Multi-language support

**Browser Support:**
- ✅ Chrome/Edge: Full support
- ⚠️ Safari: Partial support
- ❌ Firefox: Limited (requires flag)

### Tier 2: OpenAI Whisper (Fallback)
Server-side transcription for unsupported browsers.

**Features:**
- High accuracy (whisper-1 model)
- Multi-language support
- Retry logic with exponential backoff
- Rate limiting (10 req/min)
- File size validation (max 25MB)

### Tier 3: Deepgram (Optional Premium)
Best accuracy for African accents.

**Status:** Not yet implemented
**Planned Features:**
- Real-time streaming
- Nova-2 model
- WebSocket connection

## Services

### WebSpeechRecognition
```typescript
import { webSpeechRecognition } from '~/services/voice';

webSpeechRecognition.startListening(
  (result) => console.log(result.transcript),
  (error) => console.error(error),
  { language: 'en-US', enableVAD: true }
);
```

### WhisperRecognition
```typescript
import { whisperRecognition } from '~/services/voice';

const result = await whisperRecognition.transcribe(audioBlob, 'en');
```

### VoiceRecognitionService (Unified)
```typescript
import { voiceRecognitionService } from '~/services/voice';

const result = await voiceRecognitionService.recognizeFromAudio(audioBlob);
// Automatically tries Web Speech first, falls back to Whisper
```

## Components

### EnhancedVoiceRecorder
```typescript
import { EnhancedVoiceRecorder } from '~/components/voicepay';

<EnhancedVoiceRecorder
  onTranscript={(transcript, confidence) => {
    console.log(transcript, confidence);
  }}
/>
```

### VoiceWaveform
```typescript
import { VoiceWaveform } from '~/components/voicepay';

<VoiceWaveform isRecording={true} audioLevel={50} />
```

### LanguageSelector
```typescript
import { LanguageSelector } from '~/components/voicepay';

<LanguageSelector
  value={language}
  onChange={setLanguage}
  showAfricanOnly={true}
/>
```

## Hooks

### useVoiceRecognition
```typescript
import { useVoiceRecognition } from '~/hooks/useVoiceRecognition';

const {
  isRecording,
  isProcessing,
  transcript,
  confidence,
  startRecording,
  stopRecording,
} = useVoiceRecognition();
```

## Supported Languages

- English (US, UK, Nigeria, Ghana, Kenya)
- Hausa (Nigeria)
- Yoruba (Nigeria)
- Igbo (Nigeria)
- Swahili (Kenya)
- French

## Configuration

### Environment Variables
```bash
# Enable Web Speech API
NEXT_PUBLIC_ENABLE_WEB_SPEECH=true

# OpenAI API Key (for Whisper)
OPENAI_API_KEY=sk-...

# Deepgram API Key (optional)
DEEPGRAM_API_KEY=...
```

## Performance Targets

- ✅ Web Speech API: < 100ms latency
- ✅ Whisper API: < 3s end-to-end
- ✅ Success rate: > 90% for clear speech
- ✅ African accent accuracy: > 85%

## Error Handling

All services handle errors gracefully:
- Microphone permission denied
- Browser not supported
- Network errors
- Transcription failures
- No speech detected

## Testing

Run tests:
```bash
yarn test services/voice
```

## API Endpoint

### POST /api/transcribe
Transcribe audio using OpenAI Whisper.

**Request:**
```typescript
FormData {
  audio: File,
  language: string
}
```

**Response:**
```typescript
{
  success: boolean,
  transcript: string,
  confidence: number,
  language: string,
  duration: number
}
```

**Rate Limit:** 10 requests/minute per IP
