/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { HealthSourceTypes } from '@cv/pages/health-source/types'
import type { HealthSourceSpec } from 'services/cv'
import type { SplunkHealthSourceInfo } from '../../SplunkHealthSource.types'

export interface SplunkQueryBuilderProps {
  onSubmit: (data: SplunkHealthSourceInfo) => Promise<void>
  onPrevious: () => void
  data: SplunkHealthSourceInfo
  isTemplate?: boolean
  expressions?: string[]
}

export type MapSplunkQueryToService = {
  metricName: string
  serviceInstance?: string
  query: string
  isStaleRecord?: boolean
}

export interface SplunkQueryDefinition {
  name: string
  query: string
  serviceInstanceIdentifier?: string
  identifier?: string
}

export type SplunkHealthSourceSpec = HealthSourceSpec & {
  connectorRef: string
  feature: string
  queries: SplunkQueryDefinition[]
}
export interface SplunkHealthSourcePayload {
  name: string
  type: HealthSourceTypes.Splunk
  identifier: string
  spec: SplunkHealthSourceSpec
}
