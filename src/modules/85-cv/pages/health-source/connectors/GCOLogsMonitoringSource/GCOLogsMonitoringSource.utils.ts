/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { HealthSourceTypes } from '../../types'
import type {
  GCOLogsHealthSourcePayload,
  MapGCOLogsQueryToService
} from './components/MapQueriesToHarnessService/types'
import type { GCOMonitoringSourceInfo } from './GoogleCloudOperationsMonitoringSourceUtils'

export function createGCOLogsHealthSourcePayload(setupSource: GCOMonitoringSourceInfo): GCOLogsHealthSourcePayload {
  const gcoLogsPayload: GCOLogsHealthSourcePayload = {
    type: HealthSourceTypes.StackdriverLog,
    identifier: setupSource?.identifier as string,
    name: setupSource?.name as string,
    spec: {
      connectorRef: setupSource.connectorRef as string,
      feature: 'Cloud Logs',
      queries: []
    }
  }

  for (const entry of setupSource?.mappedServicesAndEnvs?.entries() || []) {
    const { metricName, query, serviceInstance, messageIdentifier }: MapGCOLogsQueryToService = entry[1]
    gcoLogsPayload.spec.queries.push({
      name: metricName,
      query,
      serviceInstanceIdentifier: serviceInstance,
      messageIdentifier: messageIdentifier
    })
  }
  return gcoLogsPayload
}
