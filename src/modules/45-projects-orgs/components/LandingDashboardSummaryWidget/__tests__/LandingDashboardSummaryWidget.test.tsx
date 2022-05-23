/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import moment from 'moment'
import * as dashboardServices from 'services/dashboard-service'
import { TestWrapper } from '@common/utils/testUtils'
import LandingDashboardContext from '@common/factories/LandingDashboardContext'
import type { ResponseExecutionResponseCountOverview } from 'services/dashboard-service'
import { startOfDay } from '@common/components/TimeRangeSelector/TimeRangeSelector'
import LandingDashboardSummaryWidget from '../LandingDashboardSummaryWidget'

import overviewCountMock from '../../OverviewGlanceCards/__tests__/overviewMock.json'
import topProjectsData from './topProjectsMock.json'

const getCountData = jest.fn(() => {
  return Promise.resolve(overviewCountMock)
})

const getTopProjectsData = jest.fn(() => {
  return Promise.resolve(topProjectsData)
})

jest
  .spyOn(dashboardServices, 'useGetCounts')
  .mockImplementation(() => ({ mutate: getCountData, refetch: getCountData, data: overviewCountMock } as any))

jest
  .spyOn(dashboardServices, 'useGetTopProjects')
  .mockImplementation(() => ({ mutate: getTopProjectsData, refetch: getTopProjectsData, data: topProjectsData } as any))

describe('LandingDashboard At a Glance', () => {
  test('LandingDashboard rendering', async () => {
    const { container, queryByText } = render(
      <TestWrapper>
        <LandingDashboardContext.Provider
          value={{
            selectedTimeRange: {
              range: [startOfDay(moment().subtract(1, 'month').add(1, 'day')), startOfDay(moment())],
              label: 'common.duration.month'
            },
            selectTimeRange: () => void 0,
            scope: { accountIdentifier: 'testAccount' }
          }}
        >
          <LandingDashboardSummaryWidget glanceCardData={overviewCountMock as ResponseExecutionResponseCountOverview} />
        </LandingDashboardContext.Provider>
      </TestWrapper>
    )

    await waitFor(() => expect(getTopProjectsData).toBeCalledTimes(1))
    expect(getCountData).toBeCalledTimes(0)

    expect(queryByText('+137')).toBeInTheDocument()
    expect(queryByText('deploymentsText')).toBeInTheDocument()
    expect(queryByText('dev test')).toBeInTheDocument()
    expect(queryByText('47')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
