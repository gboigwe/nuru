# Changelog

All notable changes to Nuru will be documented in this file.

## [Unreleased]

### Added - Issue #68: Real-Time Voice Recognition with Web Speech API and Whisper

#### Services
- `WebSpeechRecognition` - Enhanced with VAD and confidence scoring
- `WhisperRecognition` - OpenAI Whisper API integration with retry
- `VoiceRecognitionService` - Unified service with automatic fallback
- Whisper API endpoint at `/api/transcribe` with rate limiting

#### Components
- `EnhancedVoiceRecorder` - Production-ready voice recorder
- `VoiceWaveform` - Visual feedback during recording
- `LanguageSelector` - Multi-language selection UI

#### Hooks
- `useVoiceRecognition` - React hook for voice recognition

#### Features
- Multi-tier recognition (Web Speech → Whisper)
- Voice Activity Detection with 2s silence timeout
- Confidence threshold validation (0.5 minimum)
- Multi-language support (10 languages including African)
- Real-time waveform visualization
- Rate limiting (10 requests/minute)
- Automatic fallback on errors
- Retry logic with exponential backoff

#### Languages Supported
- English (US, UK, Nigeria, Ghana, Kenya)
- Hausa, Yoruba, Igbo (Nigeria)
- Swahili (Kenya)
- French

#### Documentation
- Comprehensive voice services README
- Environment variable configuration
- Usage examples and API documentation

---

**Completed by:** Amazon Q  
**Date:** 2025  
**Total Commits:** 14  
**Status:** ✅ Ready for Review
