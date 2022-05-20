/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as cvService from 'services/cv'
import { useQueryParams } from '@common/hooks'
import type { ExecutionNode } from 'services/pipeline-ng'
import { logsNodeNamesMock, mockedLogAnalysisData, mockedLogChartsData } from './LogAnalysisContainer.mocks'
import LogAnalysisContainer from '../LogAnalysisView.container'
import type { LogAnalysisContainerProps } from '../LogAnalysis.types'

const WrapperComponent = (props: LogAnalysisContainerProps): JSX.Element => {
  return (
    <TestWrapper
      path="account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/pipeline/executions/:executionId/pipeline"
      pathParams={{
        accountId: '1234_accountId',
        projectIdentifier: '1234_project',
        orgIdentifier: '1234_ORG',
        executionId: 'Test_execution'
      }}
    >
      <LogAnalysisContainer {...props} />
    </TestWrapper>
  )
}

const fetchLogsAnalysisData = jest.fn()
const fetchChartsAnalysisData = jest.fn()
const fetchNodeNames = jest.fn()

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
jest.spyOn(cvService, 'useGetVerifyStepNodeNames').mockReturnValue({
  data: logsNodeNamesMock,
  refetch: fetchNodeNames
})

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useQueryParams: jest.fn(() => ({}))
}))

const useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy = jest
  .spyOn(cvService, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  .mockReturnValue({
    data: mockedLogAnalysisData,
    refetch: fetchLogsAnalysisData
  })

const useGetVerifyStepDeploymentRadarChartLogAnalysisClustersSpy = jest
  .spyOn(cvService, 'useGetVerifyStepDeploymentRadarChartLogAnalysisClusters')
  .mockReturnValue({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    data: mockedLogChartsData,
    refetch: fetchChartsAnalysisData
  })

describe('Unit tests for LogAnalysisContainer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const initialProps = {
    step: {
      progressData: {
        activityId: 'activityId-1'
      }
    } as unknown as ExecutionNode,
    hostName: 'hostName-1'
  }

  test('Verify if apis for fetching logs data and cluster data is called with correct query params when hostname is not present', async () => {
    const newProps = { ...initialProps, hostName: '' }
    render(<WrapperComponent {...newProps} />)

    await waitFor(() => {
      expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: undefined,
          maxAngle: 360,
          minAngle: 0,
          pageNumber: 0,
          pageSize: 10
        },
        verifyStepExecutionId: 'activityId-1'
      })
      expect(useGetVerifyStepDeploymentRadarChartLogAnalysisClustersSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: undefined
        },
        verifyStepExecutionId: 'activityId-1'
      })
    })
  })

  test('Verify if apis for fetching logs data and cluster data are called with correct query params when hostname is present', async () => {
    render(<WrapperComponent {...initialProps} />)
    await waitFor(() => {
      expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1'],
          maxAngle: 360,
          minAngle: 0,
          pageNumber: 0,
          pageSize: 10
        },
        verifyStepExecutionId: 'activityId-1'
      })

      expect(useGetVerifyStepDeploymentRadarChartLogAnalysisClustersSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1']
        },
        verifyStepExecutionId: 'activityId-1'
      })
    })
  })

  test('Verify if apis for fetching logs data and cluster data are called again with new query params whenever activity Id is changed', async () => {
    const newProps = {
      ...initialProps,
      step: {
        progressData: {
          activityId: 'activityId-2'
        }
      } as unknown as ExecutionNode
    }
    render(<WrapperComponent {...newProps} />)
    await waitFor(() => {
      expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1'],
          maxAngle: 360,
          minAngle: 0,
          pageNumber: 0,
          pageSize: 10
        },
        verifyStepExecutionId: 'activityId-2'
      })

      expect(useGetVerifyStepDeploymentRadarChartLogAnalysisClustersSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1']
        },
        verifyStepExecutionId: 'activityId-2'
      })
    })
  })

  test('should render correct event count details', () => {
    render(<WrapperComponent {...initialProps} />)

    expect(screen.getByTestId('KNOWN_EVENT-count')).toBeInTheDocument()
    expect(screen.getByTestId('UNKNOWN_EVENT-count')).toBeInTheDocument()
    expect(screen.getByTestId('UNEXPECTED_FREQUENCY-count')).toBeInTheDocument()
  })

  test('Verify if Filtering by cluster type works correctly', () => {
    render(<WrapperComponent {...initialProps} />)

    expect((screen.getByTestId('cv.known') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unknown') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unexpectedFrequency') as HTMLInputElement).checked).toBe(true)

    expect(screen.getByTestId('LogAnalysis_totalClusters')).toHaveTextContent('3')

    fireEvent.click(screen.getByTestId('cv.known'))

    expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
      queryParamStringifyOptions: { arrayFormat: 'repeat' },
      queryParams: {
        accountId: '1234_accountId',
        clusterTypes: ['UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
        healthSources: undefined,
        hostNames: ['hostName-1'],
        maxAngle: 360,
        minAngle: 0,
        pageNumber: 0,
        pageSize: 10
      },
      verifyStepExecutionId: 'activityId-1'
    })
  })

  test('should pass if no counts are displayed when logs API error occured', () => {
    jest
      .spyOn(cvService, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .mockReturnValue({
        data: {},
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        error: {},
        refetch: fetchLogsAnalysisData
      })
    render(<WrapperComponent {...initialProps} />)

    expect((screen.getByTestId('cv.known') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unknown') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unexpectedFrequency') as HTMLInputElement).checked).toBe(true)

    expect(screen.queryByTestId('LogAnalysis_totalClusters')).not.toBeInTheDocument()
  })

  test('should call the APIs with correct hostname once it changes', async () => {
    const { rerender } = render(<WrapperComponent {...initialProps} />)

    await waitFor(() => {
      expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1'],
          maxAngle: 360,
          minAngle: 0,
          pageNumber: 0,
          pageSize: 10
        },
        verifyStepExecutionId: 'activityId-1'
      })
    })

    expect(useGetVerifyStepDeploymentRadarChartLogAnalysisClustersSpy).toHaveBeenCalledWith({
      queryParamStringifyOptions: { arrayFormat: 'repeat' },
      queryParams: {
        accountId: '1234_accountId',
        clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
        healthSources: undefined,
        hostNames: ['hostName-1']
      },
      verifyStepExecutionId: 'activityId-1'
    })

    rerender(<WrapperComponent {...initialProps} hostName="ABC" />)

    expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
      queryParamStringifyOptions: { arrayFormat: 'repeat' },
      queryParams: {
        accountId: '1234_accountId',
        clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
        healthSources: undefined,
        hostNames: ['ABC'],
        maxAngle: 360,
        minAngle: 0,
        pageNumber: 0,
        pageSize: 10
      },
      verifyStepExecutionId: 'activityId-1'
    })

    expect(useGetVerifyStepDeploymentRadarChartLogAnalysisClustersSpy).toHaveBeenCalledWith({
      queryParamStringifyOptions: { arrayFormat: 'repeat' },
      queryParams: {
        accountId: '1234_accountId',
        clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
        healthSources: undefined,
        hostNames: ['ABC']
      },
      verifyStepExecutionId: 'activityId-1'
    })
  })

  test('should call correct API when node filter is applied', async () => {
    render(<WrapperComponent {...initialProps} />)
    expect(screen.getByTestId(/node_name_filter/)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(/node_name_filter/))
    await waitFor(() => expect(document.querySelector('[class*="menuItem"]')).not.toBeNull())
    fireEvent.click(screen.getByText('V'))
    jest.runTimersToTime(1000)

    await waitFor(() =>
      expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1', 'V'],
          maxAngle: 360,
          minAngle: 0,
          pageNumber: 0,
          pageSize: 10
        },
        verifyStepExecutionId: 'activityId-1'
      })
    )
  })

  test('should render no data if no data is present', () => {
    jest.spyOn(cvService, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult').mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: { data: { resource: { ...mockedLogAnalysisData.resource, logAnalysisRadarCharts: { content: [] } } } },
      refetch: fetchLogsAnalysisData
    })

    render(<WrapperComponent {...initialProps} />)

    expect(screen.getByTestId(/LogAnalysisList_NoData/)).toBeInTheDocument()
    expect(screen.getByText(/cv.monitoredServices.noMatchingData/)).toBeInTheDocument()
  })

  test('should have correct nodes placeholder name', async () => {
    render(<WrapperComponent {...initialProps} hostName={undefined} />)

    const filter = screen.getByTestId(/node_name_filter/)

    expect(filter.querySelector('.MultiSelectDropDown--label')).toHaveTextContent('pipeline.nodesLabel: all')

    fireEvent.click(screen.getByTestId(/node_name_filter/))
    await waitFor(() => expect(document.querySelector('[class*="menuItem"]')).not.toBeNull())
    fireEvent.click(screen.getByText('V'))

    expect(filter.querySelector('.MultiSelectDropDown--counter')).toBeInTheDocument()
  })

  test('should render error UI if logs API fails', () => {
    const errorObj = {
      message: 'Failed to fetch: Failed to fetch',
      data: 'Failed to fetch'
    }

    jest
      .spyOn(cvService, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .mockReturnValue({
        data: {},
        error: errorObj
      })

    render(<WrapperComponent {...initialProps} hostName={undefined} />)

    expect(screen.getByTestId('LogAnalysisList_error')).toBeInTheDocument()
    expect(screen.getByText('"Failed to fetch"')).toBeInTheDocument()
  })

  test('should check whether the log analysis call was called without known filter if it has filterAnomalous query param set to true', async () => {
    // eslint-disable-next-line
    // @ts-ignore
    useQueryParams.mockImplementation(() => ({ filterAnomalous: 'true' }))

    render(<WrapperComponent {...initialProps} />)

    await waitFor(() =>
      expect(useGetVerifyStepDeploymentLogAnalysisRadarChartReslutSpy).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: '1234_accountId',
          clusterTypes: ['UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          healthSources: undefined,
          hostNames: ['hostName-1'],
          maxAngle: 360,
          minAngle: 0,
          pageNumber: 0,
          pageSize: 10
        },
        verifyStepExecutionId: 'activityId-1'
      })
    )
  })

  test('should show only one no matching data if both APIs returns have data to display', () => {
    jest.spyOn(cvService, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult').mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: { data: { resource: { ...mockedLogAnalysisData.resource, logAnalysisRadarCharts: { content: [] } } } },
      refetch: fetchLogsAnalysisData
    })

    jest.spyOn(cvService, 'useGetVerifyStepDeploymentRadarChartLogAnalysisClusters').mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: { data: { resource: [] } }
    })
    render(<WrapperComponent {...initialProps} />)

    expect(screen.getByTestId(/LogAnalysis_common_noData/)).toBeInTheDocument()
    expect(screen.getAllByText(/cv.monitoredServices.noMatchingData/)).toHaveLength(1)
  })
})
