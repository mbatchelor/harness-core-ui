/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { GetDataError } from 'restful-react'
import type { LogData } from 'services/cv'
import type { LogAnalysisRowData } from '../../LogAnalysisRow.types'

export interface LogAnalysisRiskAndJiraModalProps {
  rowData: LogAnalysisRowData
  onHide: (data?: any) => void
  isDataLoading?: boolean
  logsError?: GetDataError<unknown> | null
  retryLogsCall?: () => void
}

export interface RiskAndMessageFormProps {
  handleSubmit: () => void
  hasSubmitted?: boolean
}

export interface ActivityHeadingContentProps {
  count: number
  trendData?: Highcharts.Options
  activityType?: LogData['tag']
}

export interface SampleDataProps {
  logMessage?: string
}
