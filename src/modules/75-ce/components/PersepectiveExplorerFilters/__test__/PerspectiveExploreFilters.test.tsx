/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import { TestWrapper } from '@common/utils/testUtils'
import { QlceViewTimeGroupType } from 'services/ce/services'
import PersepectiveExplorerFilters from '../PerspectiveExplorerFilters'

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('Test case for perspective explore filters', () => {
  test('Should render as expected', () => {
    const responseState = {
      executeQuery: () => {
        return fromValue({})
      }
    }
    const setAggregation = jest.fn()
    const setTimeRange = jest.fn()
    const setFilters = jest.fn()
    const { container, getByText } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <PersepectiveExplorerFilters
            aggregation={QlceViewTimeGroupType.Day}
            setAggregation={setAggregation}
            setTimeRange={setTimeRange}
            timeRange={{
              to: '2022-19-05',
              from: '2022-19-05'
            }}
            setFilters={setFilters}
            filters={[]}
          />
        </Provider>
      </TestWrapper>
    )

    const groupByBtn = container.querySelector('[data-testid="groupBy"]')
    expect(groupByBtn).toBeDefined()
    act(() => {
      fireEvent.click(groupByBtn!)
    })

    const monthlyGroupBy = getByText('ce.perspectives.timeAggregation.monthly')
    act(() => {
      fireEvent.click(monthlyGroupBy!)
    })
    expect(setAggregation).toBeCalledWith(QlceViewTimeGroupType.Month)

    const weeklyGroupBy = getByText('triggers.schedulePanel.weeklyTabTitle')
    act(() => {
      fireEvent.click(weeklyGroupBy!)
    })
    expect(setAggregation).toBeCalledWith(QlceViewTimeGroupType.Week)

    expect(container).toMatchSnapshot()
  })
})
