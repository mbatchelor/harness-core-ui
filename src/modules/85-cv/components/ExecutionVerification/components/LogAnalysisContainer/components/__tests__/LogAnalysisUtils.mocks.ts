import type {
  RestResponseAnalyzedRadarChartLogDataWithCountDTO,
  RestResponseLogAnalysisRadarChartListWithCountDTO
} from 'services/cv'

export const logsData: RestResponseLogAnalysisRadarChartListWithCountDTO = {
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
          baseline: {
            message: '< Transfer-Encoding: chunked\r\n',
            label: 0,
            risk: 'NO_ANALYSIS',
            clusterType: 'BASELINE',
            count: 0,
            frequencyData: [2.0],
            hasControlData: false
          },
          hasControlData: true,
          clusterId: '1'
        },
        {
          message:
            '2022-02-10 07:22:59 UTC | TRACE | INFO | (pkg/trace/info/stats.go:104 in LogStats) | No data received',
          label: 30003,
          risk: 'UNHEALTHY',
          clusterType: 'UNKNOWN_EVENT',
          count: 1,
          frequencyData: [1.0],
          hasControlData: false,
          clusterId: '2'
        }
      ],
      pageIndex: 0,
      empty: false
    }
  },
  responseMessages: []
}

export const logsDataForServicePage: RestResponseAnalyzedRadarChartLogDataWithCountDTO = {
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
          frequencyData: [
            {
              count: 12,
              timestamp: 1
            },
            {
              count: 13,
              timestamp: 1
            }
          ],
          clusterId: '1'
        },
        {
          message:
            '2022-02-10 07:22:59 UTC | TRACE | INFO | (pkg/trace/info/stats.go:104 in LogStats) | No data received',
          label: 30003,
          risk: 'UNHEALTHY',
          clusterType: 'UNKNOWN_EVENT',
          count: 1,
          frequencyData: [
            {
              count: 111,
              timestamp: 32
            },
            {
              count: 78,
              timestamp: 6
            }
          ],
          clusterId: '2'
        }
      ],
      pageIndex: 0,
      empty: false
    }
  },
  responseMessages: []
}
