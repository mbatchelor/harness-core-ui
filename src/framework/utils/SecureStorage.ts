/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { PREFERENCES_TOP_LEVEL_KEY } from 'framework/PreferenceStore/PreferenceStoreContext'

export function encode(arg: unknown): string | undefined {
  if (typeof arg != 'undefined') return btoa(encodeURIComponent(JSON.stringify(arg)))
}

export function decode<T = unknown>(arg: string): T {
  return JSON.parse(decodeURIComponent(atob(arg)))
}

export default class SecureStorage {
  public static set(key: string, value: unknown): void {
    const str = encode(value)
    if (str) localStorage.setItem(key, str)
  }

  public static get<T = unknown>(key: string): T | undefined {
    const str = localStorage.getItem(key)
    if (str) return decode<T>(str)
  }

  public static clear(): void {
    // clear localStorage, except fields to persist across user-sessions:
    const storage: Record<string, string> = {
      [PREFERENCES_TOP_LEVEL_KEY]: localStorage.getItem(PREFERENCES_TOP_LEVEL_KEY) || ''
    }

    localStorage.clear()

    Object.entries(storage).forEach(([key, val]) => {
      localStorage.setItem(key, val)
    })
  }
}
