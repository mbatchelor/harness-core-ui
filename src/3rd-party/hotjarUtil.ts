/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useMemo } from 'react'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useAppStore } from 'framework/AppStore/AppStoreContext'

export function useShouldIntegrateHotJar(): boolean {
  const { licenseInformation } = useLicenseStore()
  const { currentUserInfo } = useAppStore()
  const { email } = currentUserInfo

  // HotJar is integrated for non-paid accounts (https://harness.atlassian.net/browse/PLG-946):
  // 		1. Community = window.deploymentType is 'COMMUNITY'
  // 		2. Trial = deploymentType is 'SAAS' AND account does not have any paid module
  return useMemo(() => {
    const isProd = /^app.harness.io$/i.test(location.hostname)
    const isCommunity = window.deploymentType === 'COMMUNITY'
    const isTrial =
      window.deploymentType === 'SAAS' &&
      licenseInformation &&
      !Object.values(licenseInformation).find(licenseInfo => licenseInfo?.licenseType === 'PAID')
    const isHarness = email?.toLowerCase().includes('@harness.io')

    return isProd && !window.hj && (isCommunity || isTrial) && !isHarness
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseInformation])
}
