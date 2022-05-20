/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty } from 'lodash-es'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { HealthSourceTypes } from '../../types'
import type { SplunkHealthSourcePayload, MapSplunkQueryToService } from './components/MapQueriesToHarnessService/types'
import type { SplunkHealthSourceInfo } from './SplunkHealthSource.types'

export function createSplunkHealthSourcePayload(setupSource: SplunkHealthSourceInfo): SplunkHealthSourcePayload {
  const splunkHealthSourcePayload: SplunkHealthSourcePayload = {
    type: HealthSourceTypes.Splunk,
    identifier: setupSource?.identifier as string,
    name: setupSource?.name as string,
    spec: {
      connectorRef: setupSource.connectorRef as string,
      feature: 'Splunk Cloud Logs',
      queries: []
    }
  }

  for (const entry of setupSource?.mappedServicesAndEnvs?.entries() || []) {
    const { metricName, query, serviceInstance }: MapSplunkQueryToService = entry[1]
    splunkHealthSourcePayload.spec.queries.push({
      name: metricName,
      query,
      serviceInstanceIdentifier: serviceInstance
    })
  }
  return splunkHealthSourcePayload
}

export function buildSplunkHealthSourceInfo(
  params: ProjectPathProps,
  data: any
): SplunkHealthSourceInfo & ProjectPathProps {
  return {
    ...params,
    name: data?.healthSourceName,
    identifier: data?.healthSourceIdentifier,
    connectorRef: data?.connectorRef,
    isEdit: data?.isEdit,
    product: data?.product?.value,
    type: HealthSourceTypes.Splunk,
    mappedServicesAndEnvs: getMappedServicesAndEnvs(data)
  }
}

const getMappedServicesAndEnvs = (data: any): Map<string, MapSplunkQueryToService> => {
  const currentHealthSource = data?.healthSourceList?.find((el: any) => el?.identifier === data?.healthSourceIdentifier)
  const mappedQueries = currentHealthSource?.spec?.queries
  if (currentHealthSource && !isEmpty(mappedQueries)) {
    const mappedServicesAndEnvs = new Map<string, MapSplunkQueryToService>()
    for (const query of mappedQueries) {
      mappedServicesAndEnvs.set(query?.name, {
        metricName: query?.name,
        serviceInstance: query?.serviceInstanceIdentifier,
        query: query?.query
      })
    }
    return mappedServicesAndEnvs
  } else {
    return new Map<string, MapSplunkQueryToService>()
  }
}
