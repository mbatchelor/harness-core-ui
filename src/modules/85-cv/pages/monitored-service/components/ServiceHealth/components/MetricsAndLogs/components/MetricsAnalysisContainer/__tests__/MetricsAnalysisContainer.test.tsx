/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, screen, fireEvent } from '@testing-library/react'
import * as cvServices from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import MetricsAnalysisContainer from '../MetricsAnalysisContainer'
import type { MetricsAnalysisProps } from '../MetricsAnalysisContainer.types'
import { mockedHealthSourcesData } from '../../../__tests__/MetricsAndLogs.mock'
import { mockedMetricsData } from './MetricsAnalysisContainer.mock'

const WrapperComponent = (props: MetricsAnalysisProps): JSX.Element => {
  return (
    <TestWrapper>
      <MetricsAnalysisContainer {...props} />
    </TestWrapper>
  )
}

jest.mock('highcharts-react-official', () => () => <></>)
const fetchMetricsData = jest.fn()

jest.mock('services/cv', () => ({
  useGetTimeSeriesMetricData: jest.fn().mockImplementation(() => {
    return { data: mockedMetricsData, refetch: fetchMetricsData, error: null, loading: false }
  }),
  useGetAllHealthSourcesForMonitoredServiceIdentifier: jest.fn().mockImplementation(() => {
    return { data: mockedHealthSourcesData, error: null, loading: false }
  })
}))

describe('Unit tests for MetricsAnalysisContainer', () => {
  const props = {
    monitoredServiceIdentifier: 'monitored_service_identifier',
    serviceIdentifier: 'service-identifier',
    environmentIdentifier: 'env-identifier',
    startTime: 1630594988077,
    endTime: 1630595011443
  }
  test('Verify if MetricsAnalysisContainer renders', async () => {
    const { container } = render(<WrapperComponent {...props} />)
    expect(container).toMatchSnapshot()
  })

  test('Verify if Metric View renders with correct number of records', async () => {
    const { container } = render(<WrapperComponent {...props} />)

    // verify default filter is Anomalous Metrics
    expect(container.querySelector('input[value="pipeline.verification.anomalousMetrics"]')).toBeInTheDocument()

    // Verify if number of records returned by the api for the first page matches with the number of records shown in the Metrics View
    await waitFor(() =>
      expect(screen.getAllByTestId('metrics-analysis-row')).toHaveLength(mockedMetricsData.resource.content.length)
    )
  })

  test('should show loading UI when the API is loading', () => {
    jest
      .spyOn(cvServices, 'useGetTimeSeriesMetricData')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .mockReturnValue({
        data: {},
        loading: true
      })

    render(<WrapperComponent {...props} />)

    expect(screen.getByTestId('MetricsAnalysis-loading')).toBeInTheDocument()
  })

  test('should show error UI when the API is loading', () => {
    const errorObj = {
      message: 'Failed to fetch: Failed to fetch',
      data: 'Failed to fetch'
    }

    jest
      .spyOn(cvServices, 'useGetTimeSeriesMetricData')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .mockReturnValue({
        data: {},
        error: errorObj
      })

    render(<WrapperComponent {...props} />)

    expect(screen.getByText('"Failed to fetch"')).toBeInTheDocument()
  })

  test('should call API with correct page number on pagination', () => {
    jest.spyOn(cvServices, 'useGetTimeSeriesMetricData').mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: mockedMetricsData,
      refetch: fetchMetricsData,
      error: null,
      loading: false
    })
    render(<WrapperComponent {...props} />)

    fireEvent.click(screen.getByRole('button', { name: '4' }))

    expect(fetchMetricsData).toHaveBeenCalledWith({
      queryParams: {
        accountId: undefined,
        anomalous: true,
        endTime: 1630595011443,
        filter: undefined,
        healthSources: undefined,
        monitoredServiceIdentifier: 'monitored_service_identifier',
        orgIdentifier: undefined,
        page: 3,
        projectIdentifier: undefined,
        size: 10,
        startTime: 1630594988077
      }
    })
  })
})
