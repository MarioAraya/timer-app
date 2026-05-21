import { describe, it, expect } from 'vitest'
import { WIM_HOF_MP3_URLS, getWimHofUrl } from './wimHofAudio'
import { t } from '../i18n/index'

const ES_URL = 'https://veqjsjzuaviqctplwkdb.supabase.co/storage/v1/object/public/audio/win_hof_4rounds-es.mp3'
const EN_URL = 'https://veqjsjzuaviqctplwkdb.supabase.co/storage/v1/object/public/audio/win_hof_4rounds.mp3'

describe('WIM_HOF_MP3_URLS', () => {
  it('contiene URL en español de Supabase', () => {
    expect(WIM_HOF_MP3_URLS.es).toBe(ES_URL)
  })

  it('contiene URL en inglés local', () => {
    expect(WIM_HOF_MP3_URLS.en).toBe(EN_URL)
  })
})

describe('getWimHofUrl', () => {
  it('retorna URL en español cuando lang es "es"', () => {
    expect(getWimHofUrl('es')).toBe(ES_URL)
  })

  it('retorna URL en inglés cuando lang es "en"', () => {
    expect(getWimHofUrl('en')).toBe(EN_URL)
  })

  it('retorna URL en inglés como fallback para lang desconocido', () => {
    expect(getWimHofUrl('fr')).toBe(EN_URL)
    expect(getWimHofUrl(undefined)).toBe(EN_URL)
    expect(getWimHofUrl(null)).toBe(EN_URL)
    expect(getWimHofUrl('')).toBe(EN_URL)
  })

  it('URL española es diferente a inglesa', () => {
    expect(getWimHofUrl('es')).not.toBe(getWimHofUrl('en'))
  })
})

describe('i18n wimHof keys', () => {
  const keys = ['wimHof.title', 'wimHof.subtitle', 'wimHof.remaining', 'wimHof.credit']

  for (const key of keys) {
    it(`'${key}' existe en ES`, () => {
      expect(t('es', key)).not.toBe(key)
      expect(t('es', key).length).toBeGreaterThan(0)
    })

    it(`'${key}' existe en EN`, () => {
      expect(t('en', key)).not.toBe(key)
      expect(t('en', key).length).toBeGreaterThan(0)
    })
  }

  it('wimHof.credit en ES es diferente al de EN', () => {
    expect(t('es', 'wimHof.credit')).not.toBe(t('en', 'wimHof.credit'))
  })
})
