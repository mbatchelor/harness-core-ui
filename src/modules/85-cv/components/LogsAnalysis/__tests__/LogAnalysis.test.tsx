/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, screen, fireEvent, act } from '@testing-library/react'
import * as cvServices from 'services/cv'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import routes from '@common/RouteDefinitions'
import { LogAnalysisContent } from '@cv/components/LogsAnalysis/LogAnalysis'
import { healthSourceMock } from '@cv/pages/monitored-service/components/ServiceHealth/components/MetricsAndLogs/__tests__/MetricsAndLogs.mock'
import type { LogAnalysisProps } from '../LogAnalysis.types'
import { logsListData, logsRadarChartData } from './LogAnalysis.mocks'
import { mockLogsCall } from '../components/LogAnalysisRow/__tests__/LogAnalysisRow.mocks'

const testWrapperProps: TestWrapperProps = {
  path: routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: 'testAcc',
    projectIdentifier: 'project1',
    orgIdentifier: 'testOrg'
  }
}

const WrapperComponent = (props: LogAnalysisProps): JSX.Element => {
  return (
    <TestWrapper {...testWrapperProps}>
      <LogAnalysisContent {...props} />
    </TestWrapper>
  )
}

jest.spyOn(cvServices, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult').mockReturnValue({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  data: mockLogsCall
})

jest.mock('highcharts-react-official', () => () => <></>)
const fetchLogAnalysis = jest.fn()
const fetchClusterData = jest.fn()

jest.mock('services/cv', () => ({
  useGetAllRadarChartLogsData: jest.fn().mockImplementation(() => {
    return { data: logsListData, loading: false, error: null, refetch: fetchLogAnalysis }
  }),
  useGetAllHealthSourcesForMonitoredServiceIdentifier: jest.fn().mockImplementation(() => {
    return { data: healthSourceMock, error: null, loading: false }
  }),
  useGetAllRadarChartLogsClusterData: jest.fn().mockImplementation(() => {
    return { data: logsRadarChartData, error: null, loading: false, refetch: fetchClusterData }
  }),
  useGetVerifyStepDeploymentLogAnalysisRadarChartResult: jest.fn().mockImplementation(() => {
    return {
      data: mockLogsCall
    }
  })
}))

describe('Unit tests for LogAnalysisContainer', () => {
  const props = {
    monitoredServiceIdentifier: 'monitored_service_identifier',
    serviceIdentifier: 'service-identifier',
    environmentIdentifier: 'env-identifier',
    startTime: 1630594988077,
    endTime: 1630595011443
  }
  test('Verify if LogAnalysisContainer renders', async () => {
    const { container } = render(<WrapperComponent {...props} />)
    expect(container).toMatchSnapshot()
  })

  test('Verify if Logs Cluster Chart and Logs Record Table is rendered correctly', async () => {
    render(<WrapperComponent {...props} />)

    // Verify if number of records returned by the api for the first page matches with the number of records shown in the Logs Table
    await waitFor(() =>
      expect(screen.getAllByTestId('logs-data-row')).toHaveLength(
        logsListData.resource.logAnalysisRadarCharts.content.length
      )
    )
  })

  test('Verify if Filtering by cluster and health source type works correctly', async () => {
    const useGetAllRadarChartLogsData = jest.spyOn(cvServices, 'useGetAllRadarChartLogsData').mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: logsListData,
      refetch: jest.fn()
    })

    const useGetAllRadarChartLogsClusterData = jest
      .spyOn(cvServices, 'useGetAllRadarChartLogsClusterData')
      .mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data: logsRadarChartData,
        refetch: jest.fn()
      })
    render(<WrapperComponent {...props} />)

    // verify default filter is unknownEvent
    expect((screen.getByTestId('cv.known') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unknown') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unexpectedFrequency') as HTMLInputElement).checked).toBe(true)

    fireEvent.click(screen.getByTestId('cv.known'))

    await waitFor(() =>
      expect(useGetAllRadarChartLogsData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: undefined,
          maxAngle: 360,
          minAngle: 0,
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          pageNumber: 0,
          pageSize: 10,
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )

    await waitFor(() =>
      expect(useGetAllRadarChartLogsClusterData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: undefined,
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )

    fireEvent.click(screen.getByTestId(/HealthSource_MultiSelect_DropDown/))
    await waitFor(() => expect(document.querySelector('[class*="menuItem"]')).not.toBeNull())

    fireEvent.click(screen.getByText(/custommetric/))

    await waitFor(() =>
      expect(useGetAllRadarChartLogsData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: ['service_prod/custommetric'],
          maxAngle: 360,
          minAngle: 0,
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          pageNumber: 0,
          pageSize: 10,
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )

    await waitFor(() =>
      expect(useGetAllRadarChartLogsClusterData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: ['service_prod/custommetric'],
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )

    fireEvent.click(screen.getByTestId('cv.known'))

    await waitFor(() =>
      expect(useGetAllRadarChartLogsData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: undefined,
          maxAngle: 360,
          minAngle: 0,
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          pageNumber: 0,
          pageSize: 10,
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )

    await waitFor(() =>
      expect(useGetAllRadarChartLogsClusterData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: undefined,
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )
  })

  test('should call API with correct minmax data', async () => {
    const useGetAllRadarChartLogsData = jest.spyOn(cvServices, 'useGetAllRadarChartLogsData').mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: logsListData,
      refetch: jest.fn()
    })

    render(<WrapperComponent {...props} />)

    expect(screen.getByTestId('MinMaxSlider_MinInput')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('MinMaxSlider_MinInput'), {
      target: { value: '20' }
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() =>
      expect(useGetAllRadarChartLogsData).toHaveBeenCalledWith({
        queryParamStringifyOptions: { arrayFormat: 'repeat' },
        queryParams: {
          accountId: 'testAcc',
          clusterTypes: ['KNOWN_EVENT', 'UNKNOWN_EVENT', 'UNEXPECTED_FREQUENCY'],
          endTime: 1630595011443,
          healthSources: undefined,
          maxAngle: 360,
          minAngle: 20,
          monitoredServiceIdentifier: 'monitored_service_identifier',
          orgIdentifier: 'testOrg',
          pageNumber: 0,
          pageSize: 10,
          projectIdentifier: 'project1',
          startTime: 1630594988077
        }
      })
    )
  })

  test('should show loader when both the APIs are loading', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.spyOn(cvServices, 'useGetAllRadarChartLogsData').mockReturnValue({
      data: null,
      loading: true,
      refetch: jest.fn()
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.spyOn(cvServices, 'useGetAllRadarChartLogsClusterData').mockReturnValue({
      data: null,
      loading: true,
      refetch: jest.fn()
    })
    render(<WrapperComponent {...props} />)

    expect(screen.getByTestId('LogAnalysis-loading-spinner')).toBeInTheDocument()
  })

  test('should render error UI if logs API fails', () => {
    const logAnalysisRefetch = jest.fn()

    const errorObj = {
      message: 'Failed to fetch: Failed to fetch',
      data: 'Failed to fetch'
    }

    jest
      .spyOn(cvServices, 'useGetAllRadarChartLogsData')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .mockReturnValue({
        data: {},
        error: errorObj,
        refetch: logAnalysisRefetch
      })

    render(<WrapperComponent {...props} />)

    expect(screen.getByText('"Failed to fetch"')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(logAnalysisRefetch).toHaveBeenCalled()
  })
})
