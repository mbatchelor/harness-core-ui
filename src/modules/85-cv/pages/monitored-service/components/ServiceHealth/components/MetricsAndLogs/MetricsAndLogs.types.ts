/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export enum DatasourceTypeEnum {
  APP_DYNAMICS = 'APP_DYNAMICS',
  SPLUNK = 'SPLUNK',
  STACKDRIVER = 'STACKDRIVER',
  STACKDRIVER_LOG = 'STACKDRIVER_LOG',
  KUBERNETES = 'KUBERNETES',
  NEW_RELIC = 'NEW_RELIC',
  PROMETHEUS = 'PROMETHEUS',
  DATADOG_METRICS = 'DATADOG_METRICS',
  DATADOG_LOG = 'DATADOG_LOG'
}

export interface MetricsAndLogsProps {
  monitoredServiceIdentifier: string
  serviceIdentifier: string
  environmentIdentifier: string
  startTime?: number
  endTime?: number
  showTimelineSlider?: boolean
  isErrorTrackingEnabled?: boolean
}
