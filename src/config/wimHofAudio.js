import { audioUrl, AUDIO_FILES } from './audioSource'

const [ES_FILE, EN_FILE] = AUDIO_FILES.breathing

export const WIM_HOF_MP3_URLS = {
  es: audioUrl(ES_FILE),
  en: audioUrl(EN_FILE),
}

export function getWimHofUrl(lang) {
  return WIM_HOF_MP3_URLS[lang] ?? WIM_HOF_MP3_URLS.en
}
