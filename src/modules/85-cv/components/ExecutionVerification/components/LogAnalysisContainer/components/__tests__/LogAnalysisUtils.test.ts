import { getLogAnalysisData } from '../../LogAnalysis.utils'
import { logsData, logsDataForServicePage } from './LogAnalysisUtils.mocks'

describe('LogAnalysisUtils', () => {
  test('getSingleLogData should return correct data', () => {
    const logAnalysisData = getLogAnalysisData(logsData)
    expect(logAnalysisData).toEqual([
      {
        clusterId: '1',
        clusterType: 'UNEXPECTED',
        count: 258,
        message: 'Test Message',
        messageFrequency: [
          { color: 'var(--yellow-700)', data: [45, 74, 44, 43, 52], name: 'testData', type: 'column' }
        ],
        riskStatus: 'UNHEALTHY'
      },
      {
        clusterId: '2',
        clusterType: 'UNKNOWN',
        count: 1,
        message:
          '2022-02-10 07:22:59 UTC | TRACE | INFO | (pkg/trace/info/stats.go:104 in LogStats) | No data received',
        messageFrequency: [{ color: 'var(--red-400)', data: [1], name: 'testData', type: 'column' }],
        riskStatus: 'UNHEALTHY'
      }
    ])
  })

  test('getSingleLogData should return correct data for service page', () => {
    const logAnalysisData = getLogAnalysisData(logsDataForServicePage, true)
    expect(logAnalysisData).toEqual([
      {
        clusterId: '1',
        clusterType: 'UNEXPECTED',
        count: 258,
        message: 'Test Message',
        messageFrequency: [{ color: 'var(--yellow-700)', data: [12, 13], name: 'testData', type: 'column' }],
        riskStatus: 'UNHEALTHY'
      },
      {
        clusterId: '2',
        clusterType: 'UNKNOWN',
        count: 1,
        message:
          '2022-02-10 07:22:59 UTC | TRACE | INFO | (pkg/trace/info/stats.go:104 in LogStats) | No data received',
        messageFrequency: [{ color: 'var(--red-400)', data: [111, 78], name: 'testData', type: 'column' }],
        riskStatus: 'UNHEALTHY'
      }
    ])
  })
})
