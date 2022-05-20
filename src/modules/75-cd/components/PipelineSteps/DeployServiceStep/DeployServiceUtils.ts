/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiTypeInputType, SelectOption } from '@harness/uicore'
import { isEmpty } from 'lodash-es'
import type { DeployServiceData } from './DeployServiceInterface'

export function isEditService(data: DeployServiceData): boolean {
  if (getMultiTypeFromValue(data.serviceRef) !== MultiTypeInputType.RUNTIME) {
    if (typeof data.serviceRef === 'object') {
      const serviceRef = (data.serviceRef as SelectOption).value as string
      if (!isEmpty(serviceRef)) {
        return true
      }
    } else if (!isEmpty(data.serviceRef)) {
      return true
    }
  } else if (data.service && !isEmpty(data.service.identifier)) {
    return true
  }
  return false
}

// SONAR recommendation
export const flexStart = 'flex-start'
export const ServiceRegex = /^.+stage\.spec\.serviceConfig\.serviceRef$/
