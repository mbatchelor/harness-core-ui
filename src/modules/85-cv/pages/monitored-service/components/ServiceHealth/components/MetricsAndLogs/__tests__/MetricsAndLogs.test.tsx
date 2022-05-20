/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { LogTypes, MonitoredServiceLogContentProps } from '@cv/hooks/useLogContentHook/useLogContentHook.types'
import MetricsAndLogs from '../MetricsAndLogs'
import type { MetricsAndLogsProps } from '../MetricsAndLogs.types'
import { mockedClustersData, mockedHealthSourcesData } from './MetricsAndLogs.mock'

const WrapperComponent = (props: MetricsAndLogsProps): JSX.Element => {
  return (
    <TestWrapper>
      <MetricsAndLogs {...props} />
    </TestWrapper>
  )
}

jest.mock('highcharts-react-official', () => () => <></>)
const fetchLogAnalysis = jest.fn()
const fetchMetricsData = jest.fn()
const fetchClusterData = jest.fn()

jest.mock('services/cv', () => ({
  useGetAllLogsData: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: fetchLogAnalysis })),
  useGetTimeSeriesMetricData: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: fetchMetricsData, error: null, loading: false }
  }),
  useGetAllHealthSourcesForMonitoredServiceIdentifier: jest.fn().mockImplementation(() => {
    return { data: mockedHealthSourcesData, error: null, loading: false }
  }),
  useGetAllLogsClusterData: jest.fn().mockImplementation(() => {
    return { data: mockedClustersData, error: null, loading: false, refetch: fetchClusterData }
  })
}))

jest.mock('@cv/hooks/useLogContentHook/views/MonitoredServiceLogContent', () => ({
  __esModule: true,
  default: (props: MonitoredServiceLogContentProps) => <div>{props.logType}</div>
}))

describe('Unit tests for MetricsAndLogs', () => {
  test('Verify if Metrics and Logs View is rendered when required params are defined', async () => {
    const props = {
      monitoredServiceIdentifier: 'monitored_service_identifier',
      serviceIdentifier: 'service-identifier',
      environmentIdentifier: 'env-identifier',
      startTime: 1630594988077,
      endTime: 1630595011443,
      isErrorTrackingEnabled: true
    }
    const { getByTestId } = render(<WrapperComponent {...props} />)
    expect(getByTestId('analysis-view')).toBeTruthy()
  })

  test('Verify if appropriate image is rendered when start or endtime is not present', async () => {
    const props = {
      monitoredServiceIdentifier: 'monitored_service_identifier',
      serviceIdentifier: 'service-identifier',
      environmentIdentifier: 'env-identifier',
      startTime: 0,
      endTime: 0,
      isErrorTrackingEnabled: true
    }
    const { getByTestId } = render(<WrapperComponent {...props} />)
    expect(getByTestId('analysis-image-view')).toBeTruthy()
  })

  test('should open correct dialog when clicking external API button', async () => {
    const props = {
      monitoredServiceIdentifier: 'monitored_service_identifier',
      serviceIdentifier: 'service-identifier',
      environmentIdentifier: 'env-identifier',
      startTime: 1630594988077,
      endTime: 1630595011443,
      isErrorTrackingEnabled: true
    }
    render(<WrapperComponent {...props} />)

    expect(screen.getByText('cv.externalAPICalls')).toBeInTheDocument()

    userEvent.click(screen.getByText('cv.externalAPICalls'))

    await waitFor(() => {
      expect(screen.getByText(LogTypes.ApiCallLog)).toBeInTheDocument()
      expect(screen.queryByText(LogTypes.ExecutionLog)).not.toBeInTheDocument()
    })
  })

  test('should open correct dialog when clicking external API button', async () => {
    const props = {
      monitoredServiceIdentifier: 'monitored_service_identifier',
      serviceIdentifier: 'service-identifier',
      environmentIdentifier: 'env-identifier',
      startTime: 1630594988077,
      endTime: 1630595011443,
      isErrorTrackingEnabled: true
    }
    render(<WrapperComponent {...props} />)

    expect(screen.getByText('cv.executionLogs')).toBeInTheDocument()

    userEvent.click(screen.getByText('cv.executionLogs'))

    await waitFor(() => {
      expect(screen.getByText(LogTypes.ExecutionLog)).toBeInTheDocument()
      expect(screen.queryByText(LogTypes.ApiCallLog)).not.toBeInTheDocument()
    })
  })
})
