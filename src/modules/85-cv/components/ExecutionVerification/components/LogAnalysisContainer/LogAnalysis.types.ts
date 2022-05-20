/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SeriesColumnOptions } from 'highcharts'
import type { GetDataError } from 'restful-react'

import type {
  LogData,
  RestResponseAnalyzedRadarChartLogDataWithCountDTO,
  RestResponseListLogAnalysisRadarChartClusterDTO,
  RestResponseLogAnalysisRadarChartListWithCountDTO
} from 'services/cv'
import type { ExecutionNode } from 'services/pipeline-ng'
import type { MinMaxAngleState } from './LogAnalysisView.container.types'

export type LogAnalysisRowData = {
  clusterType: LogData['tag']
  message: string
  count: number
  messageFrequency: SeriesColumnOptions[]
  riskStatus: LogData['riskStatus']
  clusterId?: string
}

export interface LogAnalysisContainerProps {
  step: ExecutionNode
  hostName?: string
  isErrorTracking?: boolean
}

export interface LogAnalysisProps {
  data: RestResponseLogAnalysisRadarChartListWithCountDTO | RestResponseAnalyzedRadarChartLogDataWithCountDTO | null
  clusterChartData: RestResponseListLogAnalysisRadarChartClusterDTO | null
  goToPage(val: number): void
  logsLoading: boolean
  clusterChartLoading: boolean
  onChangeHealthSource?: (selectedHealthSource: string) => void
  activityId?: string
  isErrorTracking?: boolean
  handleAngleChange: (value: MinMaxAngleState) => void
  filteredAngle: MinMaxAngleState
  logsError?: GetDataError<unknown> | null
  refetchLogAnalysis?: () => void
  refetchClusterAnalysis?: () => void
  clusterChartError?: GetDataError<unknown> | null
  isServicePage?: boolean
  startTime?: number
  endTime?: number
  monitoredServiceIdentifier?: string
}
