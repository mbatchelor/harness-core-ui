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
import OverviewGlanceCards from '../OverviewGlanceCards'

import overviewCountMock from './overviewMock.json'

const getData = jest.fn(() => {
  return Promise.resolve(overviewCountMock)
})

jest
  .spyOn(dashboardServices, 'useGetCounts')
  .mockImplementation(() => ({ mutate: getData, refetch: getData, data: overviewCountMock } as any))

describe('OverviewGlanceCards', () => {
  test('OverviewGlanceCards rendering', async () => {
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
          <OverviewGlanceCards glanceCardData={overviewCountMock as ResponseExecutionResponseCountOverview} />
        </LandingDashboardContext.Provider>
      </TestWrapper>
    )

    await waitFor(() => expect(queryByText('projectsText')).toBeInTheDocument())
    expect(getData).toBeCalledTimes(0)

    expect(queryByText('+137')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
