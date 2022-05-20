/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type {
  BaseHealthSourceMetricDefinition,
  BaseHealthSourceMetricInfo
} from '@cv/pages/health-source/common/utils/HealthSource.types'

export const BaseHealthSourceMetricInfoMock: BaseHealthSourceMetricInfo = {
  identifier: 'mock_identifier',
  metricName: 'mock_metric_name',
  groupName: { label: 'mock_group_name', value: 'mock_group_name' },
  riskCategory: 'Performance/INFRA',
  sli: true,
  continuousVerification: false,
  healthScore: true,
  isManualQuery: false,
  higherBaselineDeviation: false,
  lowerBaselineDeviation: false
}

export const BaseHealthSourceMetricDefinitionMock: BaseHealthSourceMetricDefinition = {
  analysis: {
    deploymentVerification: {
      enabled: false
    },
    liveMonitoring: {
      enabled: true
    },
    riskProfile: {
      category: 'Performance',
      metricType: 'INFRA',
      thresholdTypes: []
    }
  },
  groupName: 'mock_group_name',
  identifier: 'mock_identifier',
  isManualQuery: false,
  metricName: 'mock_metric_name',
  sli: {
    enabled: true
  }
}
