/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { Utils } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import type { SelectHealthSourceServicesProps } from '@cv/pages/health-source/common/SelectHealthSourceServices/SelectHealthSourceServices.types'
import * as cvServices from 'services/cv'
import NewRelicCustomMetricForm from '../NewRelicCustomMetricForm'
import { existingMetricDetails, formikValues, mappedMetricsMap } from './NewRelicCustomMetricForm.mock'

jest.mock('@cv/components/QueryViewer/QueryViewer', () => ({
  ...(jest.requireActual('@cv/components/QueryViewer/QueryViewer') as any),
  QueryViewer: function Mock(props: any) {
    return <button className="mockFetchRecords" onClick={() => props.fetchRecords()} />
  }
}))

jest.mock('@cv/components/MultiItemsSideNav/MultiItemsSideNav', () => ({
  ...(jest.requireActual('@cv/components/MultiItemsSideNav/MultiItemsSideNav') as any),
  MultiItemsSideNav: function Mock() {
    return <div className="sideNavContainer" />
  }
}))

jest.mock('@common/components/NameIdDescriptionTags/NameIdDescriptionTags', () => ({
  ...(jest.requireActual('@common/components/NameIdDescriptionTags/NameIdDescriptionTags') as any),
  NameId: function Mock() {
    return <div className="mockNameId" />
  }
}))

const mockSelectHealthSourceServices = jest.fn()
jest.mock(
  '@cv/pages/health-source/common/SelectHealthSourceServices/SelectHealthSourceServices.tsx',
  () => (props: SelectHealthSourceServicesProps) => {
    mockSelectHealthSourceServices(props)
    return <></>
  }
)

jest.mock('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs', () => ({
  ...(jest.requireActual('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs') as any),
  get SetupSourceTabsContext() {
    return React.createContext({
      tabsInfo: [],
      sourceData: { existingMetricDetails },
      onNext: jest.fn(),
      onPrevious: jest.fn()
    })
  }
}))

describe('NewRelicMappedMetric component', () => {
  const refetchMock = jest.fn()
  const fetchNewRelicTimeSeriesData = jest.fn().mockResolvedValue({
    data: [
      {
        metricName: 'new relic metric',
        metricValue: 10,
        timestamp: 0,
        txnName: 'newrelic'
      }
    ]
  })

  beforeAll(() => {
    jest
      .spyOn(cvServices, 'useGetMetricPacks')
      .mockReturnValue({ loading: false, error: null, data: {}, refetch: refetchMock } as any)
    jest.spyOn(cvServices, 'useFetchParsedSampleData').mockReturnValue({
      mutate: fetchNewRelicTimeSeriesData
    } as any)
  })

  test('should render in edit mode', async () => {
    const refetchFn = jest.fn()
    jest
      .spyOn(cvServices, 'useGetSampleDataForNRQL')
      .mockReturnValue({ refetch: refetchFn, data: { data: 'Query response json ' } } as any)

    const { container, getByText } = render(
      <TestWrapper>
        <NewRelicCustomMetricForm
          connectorIdentifier={'account.new_relic'}
          mappedMetrics={mappedMetricsMap}
          selectedMetric={'New Relic Metric'}
          formikValues={formikValues as any}
          formikSetField={jest.fn()}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('cv.healthSource.connectors.NewRelic.queryMapping')).not.toBeNull())
    fireEvent.click(getByText('cv.healthSource.connectors.NewRelic.queryMapping'))

    await waitFor(() => expect(container.querySelector('[class*="mockFetchRecords"]')).not.toBeNull())
    fireEvent.click(container.querySelector('[class*="mockFetchRecords"]')!)
    await waitFor(() => expect(refetchFn).toHaveBeenCalled())

    await waitFor(() => expect(getByText('cv.monitoringSources.assign')).not.toBeNull())
    fireEvent.click(getByText('cv.monitoringSources.assign'))

    await waitFor(() => expect(getByText('cv.healthSource.connectors.NewRelic.metricValueAndCharts')).not.toBeNull())
    fireEvent.click(getByText('cv.healthSource.connectors.NewRelic.metricValueAndCharts'))

    await waitFor(() => expect(getByText('$.timeSeries.[*].beginTimeSeconds')).toBeInTheDocument())
    await waitFor(() => expect(getByText('$.timeSeries.[*].endTimeSeconds')).toBeInTheDocument())
    fireEvent.click(getByText('cv.healthSource.connectors.buildChart'))
    await waitFor(() =>
      expect(fetchNewRelicTimeSeriesData).toHaveBeenCalledWith({
        groupName: 'Group 1',
        jsonResponse: '"Query response json "',
        metricValueJSONPath: '$.timeSeries.[*].beginTimeSeconds',
        timestampJSONPath: '$.timeSeries.[*].endTimeSeconds'
      })
    )
  })

  test('should check whether fetch sample data call for NRQL is happening during component mount if query is present', () => {
    jest.spyOn(Utils, 'randomId').mockReturnValue('abc')
    const refetchFn = jest.fn()
    jest
      .spyOn(cvServices, 'useGetSampleDataForNRQL')
      .mockReturnValue({ refetch: refetchFn, data: { data: 'Query response json ' } } as any)

    render(
      <TestWrapper>
        <NewRelicCustomMetricForm
          connectorIdentifier={'account.new_relic'}
          mappedMetrics={mappedMetricsMap}
          selectedMetric={'New Relic Metric'}
          formikValues={formikValues as any}
          formikSetField={jest.fn()}
        />
      </TestWrapper>
    )

    expect(refetchFn).toHaveBeenCalledWith({
      queryParams: {
        accountId: undefined,
        connectorIdentifier: 'account.new_relic',
        nrql: "SELECT average(`apm.service.transaction.duration`) FROM Metric WHERE appName = 'My Application' TIMESERIES",
        orgIdentifier: undefined,
        projectIdentifier: undefined,
        requestGuid: 'abc'
      }
    })
  })
})
