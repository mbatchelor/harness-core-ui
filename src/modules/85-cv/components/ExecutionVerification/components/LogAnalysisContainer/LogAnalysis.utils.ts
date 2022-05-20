/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption } from '@harness/uicore'
import { getEventTypeChartColor } from '@cv/utils/CommonUtils'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { UseStringsReturn } from 'framework/strings'
import type {
  AnalyzedRadarChartLogDataDTO,
  FrequencyDTO,
  LogAnalysisRadarChartListDTO,
  LogData,
  RestResponseAnalyzedRadarChartLogDataWithCountDTO,
  RestResponseLogAnalysisRadarChartListWithCountDTO
} from 'services/cv'
import type { LogAnalysisRowData } from './LogAnalysis.types'
import { EventTypeFullName } from './LogAnalysis.constants'

export const mapClusterType = (type: string): LogData['tag'] => {
  switch (type) {
    case EventTypeFullName.KNOWN_EVENT:
      return 'KNOWN'
    case EventTypeFullName.UNKNOWN_EVENT:
      return 'UNKNOWN'
    case EventTypeFullName.UNEXPECTED_FREQUENCY:
      return 'UNEXPECTED'
    default:
      return 'KNOWN'
  }
}

export const getClusterTypes = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return [
    { label: getString('cv.known'), value: EventTypeFullName.KNOWN_EVENT },
    { label: getString('cv.unknown'), value: EventTypeFullName.UNKNOWN_EVENT },
    { label: getString('cv.unexpectedFrequency'), value: EventTypeFullName.UNEXPECTED_FREQUENCY }
  ]
}

function getFrequencyDataValues(frequencyData?: number[] | FrequencyDTO[], isServicePage?: boolean): number[] {
  if (!isServicePage || typeof frequencyData === 'undefined') return frequencyData as number[]

  return (frequencyData as FrequencyDTO[]).map((datum: FrequencyDTO) => datum.count) as number[]
}

export const getSingleLogData = (
  logData: LogAnalysisRadarChartListDTO | AnalyzedRadarChartLogDataDTO,
  isServicePage?: boolean
): LogAnalysisRowData => {
  return {
    clusterType: mapClusterType(logData?.clusterType as string),
    count: logData?.count as number,
    message: logData?.message as string,
    messageFrequency: [
      {
        name: 'testData',
        type: 'column',
        color: getEventTypeChartColor(logData?.clusterType),
        data: getFrequencyDataValues(logData?.frequencyData, isServicePage)
      }
    ],
    clusterId: logData?.clusterId,
    riskStatus: logData?.risk
  }
}

export function getLogAnalysisData(
  data: RestResponseLogAnalysisRadarChartListWithCountDTO | RestResponseAnalyzedRadarChartLogDataWithCountDTO | null,
  isServicePage?: boolean
): LogAnalysisRowData[] {
  return (
    data?.resource?.logAnalysisRadarCharts?.content?.map(
      (datum: LogAnalysisRadarChartListDTO | AnalyzedRadarChartLogDataDTO) => getSingleLogData(datum, isServicePage)
    ) ?? []
  )
}

export function getInitialNodeName(selectedHostName?: string): MultiSelectOption[] {
  if (!selectedHostName) {
    return []
  }

  return [
    {
      label: selectedHostName,
      value: selectedHostName
    }
  ]
}
