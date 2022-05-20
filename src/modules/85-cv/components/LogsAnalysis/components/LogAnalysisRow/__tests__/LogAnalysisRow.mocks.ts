/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RiskValues } from '@cv/utils/CommonUtils'

// clusterType
// message
// count
// messageFrequency
// riskStatus

const messageFrequency = [
  {
    name: 'testData',
    type: 'column',
    color: 'var(--primary-3)',
    data: [1]
  }
]

export const mockedLogAnalysisData = {
  metaData: {},
  resource: {
    totalPages: 5,
    totalItems: 51,
    pageItemCount: 0,
    pageSize: 10,
    content: [
      {
        message: 'Done with entity',
        clusterType: 'KNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 410,
        messageFrequency,
        label: 1,
        clusterId: 'abc'
      },
      {
        message:
          "[processNextCVTasks] Total time taken to process accountId Account{companyName='Shaw', accountName='Shaw 2'} is 1 (ms)",
        clusterType: 'KNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 330,
        messageFrequency,
        label: 2
      },
      {
        message: 'for VP4Jp_fnRwObcTDj_hu8qA the cron will handle data collection',
        clusterType: 'UNEXPECTED_FREQUENY',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 19,
        messageFrequency,
        label: 3
      },
      {
        message:
          "[expireLongRunningCVTasks] Total time taken to process accountId Account{companyName='Arch U.S. MI Services Inc.', accountName='Arch U.S. MI Services Inc.-6206'} is 2 (ms)",
        clusterType: 'UNEXPECTED_FREQUENY',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 3,
        messageFrequency,
        label: 4
      },
      {
        message:
          "[retryCVTasks] Total time taken to process accountId Account{companyName='Harness.io', accountName='Puneet Test Pro'} is 0 (ms)",
        clusterType: 'KNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 3,
        messageFrequency,
        label: 5
      },
      {
        message:
          "[expireLongRunningCVTasks] Total time taken to process accountId Account{companyName='Harness', accountName='CS - Marcos Gabriel-4229'} is 1 (ms)",
        clusterType: 'KNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 3,
        messageFrequency,
        label: 6
      },
      {
        message:
          "[expireLongRunningCVTasks] Total time taken to process accountId Account{companyName='New York Life', accountName='NYL'} is 2 (ms)",
        clusterType: 'KNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 3,
        messageFrequency,
        label: 7
      },
      {
        message:
          "[expireLongRunningCVTasks] Total time taken to process accountId Account{companyName='Times Higher Education', accountName='Times Higher Education'} is 2 (ms)",
        clusterType: 'KNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 9,
        messageFrequency,
        label: 8
      },
      {
        message:
          "[retryCVTasks] Total time taken to process accountId Account{companyName='CS - Venkat2', accountName='CS - Venkat2'} is 0 (ms)",
        clusterType: 'UNKNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 12,
        messageFrequency,
        label: 9
      },
      {
        message:
          "[expireLongRunningCVTasks] Total time taken to process accountId Account{companyName='AppDynamics', accountName='AppDynamics - Sales Demo'} is 2 (ms)",
        clusterType: 'UNKNOWN',
        riskStatus: RiskValues.HEALTHY,
        riskScore: 0.0,
        count: 3,
        messageFrequency,
        label: 10
      }
    ],
    pageIndex: 0,
    empty: false
  },
  responseMessages: []
}

export const mockLogsCall = {
  metaData: {},
  resource: {
    totalClusters: 29,
    eventCounts: [
      {
        clusterType: 'KNOWN_EVENT',
        count: 24,
        displayName: 'Known'
      },
      {
        clusterType: 'UNKNOWN_EVENT',
        count: 4,
        displayName: 'Unknown'
      },
      {
        clusterType: 'UNEXPECTED_FREQUENCY',
        count: 1,
        displayName: 'Unexpected Frequency'
      }
    ],
    logAnalysisRadarCharts: {
      totalPages: 3,
      totalItems: 29,
      pageItemCount: 10,
      pageSize: 10,
      content: [
        {
          message: '< Transfer-Encoding: chunked\r\n',
          label: 0,
          clusterId: 'abc',
          risk: 'UNHEALTHY',
          clusterType: 'UNEXPECTED_FREQUENCY',
          count: 258,
          frequencyData: [45, 74, 44, 43, 52],
          baseline: {
            message: '< Transfer-Encoding: chunked\r\n',
            label: 0,
            risk: 'NO_ANALYSIS',
            clusterType: 'BASELINE',
            count: 0,
            frequencyData: [2],
            baseline: null,
            hasControlData: false
          },
          hasControlData: true
        }
      ],
      pageIndex: 0,
      empty: false
    }
  },
  responseMessages: []
}

export const mockServicePageLogsCall = {
  metaData: {},
  resource: {
    totalClusters: 29,
    eventCounts: [
      {
        clusterType: 'KNOWN_EVENT',
        count: 24,
        displayName: 'Known'
      },
      {
        clusterType: 'UNKNOWN_EVENT',
        count: 4,
        displayName: 'Unknown'
      },
      {
        clusterType: 'UNEXPECTED_FREQUENCY',
        count: 1,
        displayName: 'Unexpected Frequency'
      }
    ],
    logAnalysisRadarCharts: {
      totalPages: 3,
      totalItems: 29,
      pageItemCount: 10,
      pageSize: 10,
      content: [
        {
          message: '< Transfer-Encoding: chunked\r\n',
          label: 0,
          clusterId: 'abc',
          risk: 'UNHEALTHY',
          clusterType: 'UNEXPECTED_FREQUENCY',
          count: 258,
          frequencyData: [
            {
              count: 5,
              timestamp: 23445
            }
          ]
        }
      ],
      pageIndex: 0,
      empty: false
    }
  },
  responseMessages: []
}
