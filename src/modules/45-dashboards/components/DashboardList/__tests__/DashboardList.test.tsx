/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { DashboardType, IDashboard } from '@dashboards/types/DashboardTypes'
import type { StringKeys } from 'framework/strings'
import DashboardList, { DashboardListProps } from '../DashboardList'

const testTitle = 'test title'

const testDashboard: IDashboard = {
  id: '1',
  type: DashboardType.SHARED,
  description: 'testTag',
  title: testTitle,
  view_count: 0,
  favorite_count: 0,
  created_at: '',
  data_source: [],
  last_accessed_at: '',
  resourceIdentifier: '1'
}

const defaultProps: DashboardListProps = {
  dashboards: [],
  cloneDashboard: jest.fn(),
  deleteDashboard: jest.fn(),
  editDashboard: jest.fn()
}

const renderComponent = (props: DashboardListProps): RenderResult => {
  return render(
    <TestWrapper>
      <DashboardList {...props} />
    </TestWrapper>
  )
}

describe('DashboardList', () => {
  const cloneText: StringKeys = 'projectCard.clone'
  const deleteText: StringKeys = 'delete'
  const editText: StringKeys = 'edit'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const openContextMenu = (): void => {
    const menuButtonContent: StringKeys = 'more'
    const menuButton = screen.getByText(menuButtonContent)
    act(() => {
      fireEvent.click(menuButton)
    })
  }

  test('it should show an empty dashboard list with no dashboard data', () => {
    renderComponent(defaultProps)

    const headerName: StringKeys = 'name'
    const headerTags: StringKeys = 'tagsLabel'
    const headerFavoriteCount: StringKeys = 'dashboards.dashboardList.headerFavoriteCount'
    const headerViewCount: StringKeys = 'dashboards.dashboardList.headerViewCount'

    expect(screen.getByText(headerName)).toBeInTheDocument()
    expect(screen.getByText(headerTags)).toBeInTheDocument()
    expect(screen.getByText(headerFavoriteCount)).toBeInTheDocument()
    expect(screen.getByText(headerViewCount)).toBeInTheDocument()
  })

  test('it should show dashboard list with dashboard data', () => {
    const testProps: DashboardListProps = {
      ...defaultProps,
      dashboards: [testDashboard]
    }
    renderComponent(testProps)
    expect(screen.getByText(testTitle)).toBeInTheDocument()
  })

  test('it should allow for opening of read only context menu on shared dashboard data', async () => {
    const testProps: DashboardListProps = {
      ...defaultProps,
      dashboards: [testDashboard]
    }
    renderComponent(testProps)

    await openContextMenu()

    expect(screen.getByText(cloneText)).toBeInTheDocument()
    expect(screen.queryByText(editText)).toBeNull()
    expect(screen.queryByText(deleteText)).toBeNull()
  })

  test('it should allow for opening of editable context menu on account dashboard data', async () => {
    const testAccountDashboard: IDashboard = {
      ...testDashboard,
      resourceIdentifier: 'shared',
      type: DashboardType.ACCOUNT
    }

    const testProps: DashboardListProps = {
      ...defaultProps,
      dashboards: [testAccountDashboard]
    }
    renderComponent(testProps)

    await openContextMenu()

    expect(screen.getByText(cloneText)).toBeInTheDocument()
    expect(screen.getAllByText(editText).length).toBe(2)
    expect(screen.getByText(deleteText)).toBeInTheDocument()
  })

  test('it should trigger callback for cloning a dashboard', async () => {
    const mockCallback = jest.fn()
    const testAccountDashboard: IDashboard = {
      ...testDashboard,
      type: DashboardType.ACCOUNT
    }
    const testProps: DashboardListProps = {
      ...defaultProps,
      cloneDashboard: mockCallback,
      dashboards: [testAccountDashboard]
    }

    renderComponent(testProps)
    await openContextMenu()

    const cloneButton = screen.getByText(cloneText)
    act(() => {
      fireEvent.click(cloneButton)
    })

    expect(mockCallback).toHaveBeenCalled()
  })

  test('it should trigger callback for editing a dashboard', async () => {
    const mockCallback = jest.fn()
    const testAccountDashboard: IDashboard = {
      ...testDashboard,
      type: DashboardType.ACCOUNT
    }
    const testProps: DashboardListProps = {
      ...defaultProps,
      editDashboard: mockCallback,
      dashboards: [testAccountDashboard]
    }

    renderComponent(testProps)
    await openContextMenu()

    const editElements = screen.getAllByText(editText)
    act(() => {
      fireEvent.click(editElements[0])
    })

    expect(mockCallback).toHaveBeenCalled()
  })

  test('it should trigger callback for deleting a dashboard', async () => {
    const mockCallback = jest.fn()
    const testAccountDashboard: IDashboard = {
      ...testDashboard,
      type: DashboardType.ACCOUNT
    }
    const testProps: DashboardListProps = {
      ...defaultProps,
      deleteDashboard: mockCallback,
      dashboards: [testAccountDashboard]
    }

    renderComponent(testProps)
    await openContextMenu()

    const deleteElement = screen.getByText(deleteText)
    act(() => {
      fireEvent.click(deleteElement)
    })

    expect(mockCallback).toHaveBeenCalled()
  })
})
