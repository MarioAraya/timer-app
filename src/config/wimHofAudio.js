export const WIM_HOF_MP3_URLS = {
  es: 'https://zyfiugarcxtcyjnuopft.supabase.co/storage/v1/object/public/audio/win_hof_4rounds-es.mp3',
  en: 'https://zyfiugarcxtcyjnuopft.supabase.co/storage/v1/object/public/audio/win_hof_4rounds.mp3',
}

export function getWimHofUrl(lang) {
  return WIM_HOF_MP3_URLS[lang] ?? WIM_HOF_MP3_URLS.en
}
