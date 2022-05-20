/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { injectHotJar, identifyHotJarUser } from './HotJar'
import { useShouldIntegrateHotJar } from './hotjarUtil'

export const ThirdPartyIntegrations: React.FC = () => {
  const { currentUserInfo } = useAppStore()
  const { email, name, accounts } = currentUserInfo
  const shouldIntegrateHotJar = useShouldIntegrateHotJar()

  useEffect(() => {
    if (shouldIntegrateHotJar) {
      injectHotJar()
    }
  }, [shouldIntegrateHotJar])

  useEffect(() => {
    if (shouldIntegrateHotJar && currentUserInfo) {
      identifyHotJarUser(email, {
        email,
        name: name || email?.split('@')[0] || '',
        accountId: accounts?.find(({ uuid }) => location.hash.includes(uuid as string))?.uuid || ''
      })
    }
  }, [shouldIntegrateHotJar, currentUserInfo])

  return null
}
