export class MemoryCache {
  #entries = new Map()
  #inFlight = new Map()

  async getOrLoad(key, loader, { ttlMs = 300_000, staleMs = 1_200_000 } = {}) {
    const now = Date.now()
    const cached = this.#entries.get(key)
    if (cached && cached.expiresAt > now) return { value: cached.value, cache: 'hit' }

    const inFlight = this.#inFlight.get(key)
    if (inFlight) return { ...(await inFlight), cache: 'coalesced' }

    const promise = (async () => {
      try {
        const value = await loader()
        this.#store(key, { value, expiresAt: Date.now() + ttlMs, staleUntil: Date.now() + ttlMs + staleMs })
        return { value, cache: 'miss' }
      } catch (error) {
        const stale = this.#entries.get(key)
        if (stale && stale.staleUntil > Date.now()) return { value: stale.value, cache: 'stale' }
        throw error
      } finally {
        this.#inFlight.delete(key)
      }
    })()
    this.#inFlight.set(key, promise)
    return promise
  }

  #store(key, entry) {
    if (!this.#entries.has(key) && this.#entries.size >= 500) {
      const oldestKey = this.#entries.keys().next().value
      if (oldestKey !== undefined) this.#entries.delete(oldestKey)
    }
    this.#entries.delete(key)
    this.#entries.set(key, entry)
  }
}
