/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { AnalyzedLogDataDTO } from 'services/cv'
import { RiskValues, getRiskColorValue } from '@cv/utils/CommonUtils'

export const mockedLogAnalysisData = {
  resource: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 10,
    content: [
      {
        projectIdentifier: 'Harshil',
        orgIdentifier: 'default',
        environmentIdentifier: 'Environment_102',
        serviceIdentifier: 'Service_102',
        logData: {
          text: 'prod-setup-205416',
          label: 0,
          count: 1,
          trend: [
            {
              timestamp: 1630567200000,
              count: 1
            }
          ],
          tag: 'KNOWN'
        }
      },
      {
        projectIdentifier: 'Harshil',
        orgIdentifier: 'default',
        environmentIdentifier: 'Environment_102',
        serviceIdentifier: 'Service_102',
        logData: {
          text: 'prod-setup-205416',
          label: 0,
          count: 1,
          trend: [
            {
              timestamp: 1630567200000,
              count: 1
            }
          ],
          tag: 'UNKNOWN'
        }
      },
      {
        projectIdentifier: 'Harshil',
        orgIdentifier: 'default',
        environmentIdentifier: 'Environment_102',
        serviceIdentifier: 'Service_102',
        logData: {
          text: 'prod-setup-205416',
          label: 0,
          count: 1,
          trend: [
            {
              timestamp: 1630567200000,
              count: 1
            }
          ],
          tag: 'UNEXPECTED'
        }
      }
    ],
    pageIndex: 0,
    empty: false
  }
}

export const mockedLogsData: AnalyzedLogDataDTO[] = [
  {
    projectIdentifier: 'Harshil',
    orgIdentifier: 'CV',
    environmentIdentifier: 'prod',
    serviceIdentifier: 'service240',
    logData: {
      text: 'verification-svc',
      label: 0,
      count: 9000,
      riskScore: 0,
      riskStatus: RiskValues.HEALTHY,
      trend: [
        {
          timestamp: 1632045240000,
          count: 1000
        },
        {
          timestamp: 1632045540000,
          count: 1000
        },
        {
          timestamp: 1632043440000,
          count: 1000
        },
        {
          timestamp: 1632044340000,
          count: 1000
        },
        {
          timestamp: 1632045840000,
          count: 1000
        },
        {
          timestamp: 1632043740000,
          count: 1000
        },
        {
          timestamp: 1632044640000,
          count: 1000
        },
        {
          timestamp: 1632044040000,
          count: 1000
        },
        {
          timestamp: 1632044940000,
          count: 1000
        }
      ],
      tag: 'KNOWN'
    }
  }
]

export const mockedLogData = {
  projectIdentifier: 'Harshil',
  orgIdentifier: 'CV',
  environmentIdentifier: 'prod',
  serviceIdentifier: 'service240',
  logData: {
    text: 'verification-svc',
    label: 0,
    count: 9000,
    riskScore: 0,
    riskStatus: RiskValues.HEALTHY,
    trend: [
      {
        timestamp: 1632045240000,
        count: 1000
      },
      {
        timestamp: 1632045540000,
        count: 1000
      },
      {
        timestamp: 1632043440000,
        count: 1000
      },
      {
        timestamp: 1632044340000,
        count: 1000
      },
      {
        timestamp: 1632045840000,
        count: 1000
      },
      {
        timestamp: 1632043740000,
        count: 1000
      },
      {
        timestamp: 1632044640000,
        count: 1000
      },
      {
        timestamp: 1632044040000,
        count: 1000
      },
      {
        timestamp: 1632044940000,
        count: 1000
      }
    ],
    tag: 'KNOWN'
  }
}

export const mockedLogsTableData = [
  {
    clusterType: 'KNOWN',
    count: 9000,
    message: 'verification-svc',
    messageFrequency: [
      {
        name: 'trendData',
        type: 'column',
        color: getRiskColorValue(RiskValues.HEALTHY),
        data: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
      }
    ],
    riskScore: 0,
    riskStatus: RiskValues.HEALTHY
  }
]

export const logsRadarChartData = {
  resource: [
    {
      label: 0,
      message: 'projects/chi-play/logs/stdout',
      risk: 'HEALTHY',
      radius: 1.357564536113864,
      angle: 0,
      clusterType: 'KNOWN_EVENT',
      clusterId: 121
    },
    {
      label: 2,
      message: 'projects/chi-play/logs/stderr',
      risk: 'HEALTHY',
      radius: 1.8066135269309567,
      angle: 120,

      clusterType: 'KNOWN_EVENT',
      clusterId: 2
    },
    {
      label: 1,
      message: 'projects/chi-play/logs/events',
      risk: 'HEALTHY',
      radius: 1.480099986754282,
      angle: 240,
      clusterType: 'KNOWN_EVENT',
      clusterId: 3
    }
  ]
}

export const logsListData = {
  metaData: {},
  resource: {
    totalClusters: 29,
    eventCounts: [
      { clusterType: 'KNOWN_EVENT', count: 24, displayName: 'Known' },
      { clusterType: 'UNKNOWN_EVENT', count: 4, displayName: 'Unknown' },
      { clusterType: 'UNEXPECTED_FREQUENCY', count: 1, displayName: 'Unexpected Frequency' }
    ],
    logAnalysisRadarCharts: {
      totalPages: 3,
      totalItems: 29,
      pageItemCount: 10,
      pageSize: 10,
      content: [
        {
          message: 'Test Message',
          label: 0,
          risk: 'UNHEALTHY',
          clusterType: 'UNEXPECTED_FREQUENCY',
          count: 258,
          frequencyData: [45.0, 74.0, 44.0, 43.0, 52.0],
          clusterId: 1
        },
        {
          message:
            '2022-02-10 07:22:59 UTC | TRACE | INFO | (pkg/trace/info/stats.go:104 in LogStats) | No data received\n',
          label: 30003,
          risk: 'UNHEALTHY',
          clusterType: 'UNKNOWN_EVENT',
          count: 1,
          frequencyData: [1.0],
          baseline: null,
          hasControlData: false,
          clusterId: 2
        },
        {
          message:
            '  A v e r a g e   S p e e d       T i m  e         T i m e        D lToiamde    UCpuload   Trorteanlt \n',
          label: 30001,
          risk: 'UNHEALTHY',
          clusterType: 'UNKNOWN_EVENT',
          count: 1,
          frequencyData: [1.0],
          baseline: null,
          clusterId: 3
        },
        {
          message:
            '  % Total    % Received % Xferd  Average Spee d   %  TTimoet a  l  T i m e%   R e c eTiivmeed   %C uXrfreerndt \n',
          label: 30002,
          risk: 'UNHEALTHY',
          clusterType: 'UNKNOWN_EVENT',
          count: 1,
          frequencyData: [1.0],
          baseline: null,
          clusterId: 4
        }
      ],
      pageIndex: 0,
      empty: false
    }
  },
  responseMessages: []
}
