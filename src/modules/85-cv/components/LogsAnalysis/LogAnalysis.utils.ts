/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { UseStringsReturn } from 'framework/strings'
import type { AnalyzedLogDataDTO } from 'services/cv'
import { getRiskColorValue } from '@cv/utils/CommonUtils'
import { LogAnalysisRowData, LogEvents } from './LogAnalysis.types'

export const getClusterTypes = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return [
    // { label: getString('auditTrail.allEvents'), value: '' },
    { label: getString('cv.known'), value: LogEvents.KNOWN },
    { label: getString('cv.unknown'), value: LogEvents.UNKNOWN },
    { label: getString('cv.unexpected'), value: LogEvents.UNEXPECTED }
  ]
}

export function getLogAnalysisTableData(logsData: AnalyzedLogDataDTO[]): LogAnalysisRowData[] {
  return (
    logsData.map(log => ({
      clusterType: log.logData?.tag,
      count: log.logData?.count ?? 0,
      message: log.logData?.text ?? '',
      messageFrequency: [
        {
          name: 'trendData',
          type: 'column',
          color: getRiskColorValue(log.logData?.riskStatus),
          data: log.logData?.trend?.map(t => t.count ?? 0)
        }
      ],
      riskScore: log.logData?.riskScore ?? 0,
      riskStatus: log.logData?.riskStatus
    })) ?? []
  )
}
