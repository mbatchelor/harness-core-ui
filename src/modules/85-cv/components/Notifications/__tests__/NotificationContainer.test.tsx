/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { NotificationRuleResponse } from 'services/cv'
import NotificationsContainer from '../NotificationsContainer'
import { NotificationsContainerProps, SRMNotificationType } from '../NotificationsContainer.types'
import { mockedNotificationsTable } from './NotificationsContainer.mock'

const WrapperComponent = (props: NotificationsContainerProps): JSX.Element => {
  return (
    <TestWrapper>
      <NotificationsContainer {...props} />
    </TestWrapper>
  )
}

describe('Unit tests for NotificationsContainer', () => {
  const props = {
    children: <></>,
    type: SRMNotificationType.SERVICE_LEVEL_OBJECTIVE,
    handleDeleteNotification: jest.fn(),
    handleCreateNotification: jest.fn(),
    handleToggleNotification: jest.fn(),
    notificationsInTable: [],
    setPage: () => jest.fn(),
    loading: false,
    error: null,
    page: 0,
    getNotifications: jest.fn()
  }
  test('Verify if NotificationsContainer renders', async () => {
    const { container } = render(<WrapperComponent {...props} />)
    expect(container).toMatchSnapshot()
  })

  test('Verify if NotificationsContainer renders for notification type SERVICE_LEVEL_OBJECTIVE', async () => {
    const newProps = { ...props, type: SRMNotificationType.SERVICE_LEVEL_OBJECTIVE }
    const { container, getByText } = render(<WrapperComponent {...newProps} />)
    expect(getByText('cv.notifications.errorBudgetPolicies')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('Verify if NotificationsContainer renders for notification type MONITORED_SERVICE', async () => {
    const newProps = { ...props, type: SRMNotificationType.MONITORED_SERVICE }
    const { container, getByText } = render(<WrapperComponent {...newProps} />)
    expect(getByText('notifications.name')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('Verify if NotificationsContainer renders no notifications screen when there are no notificatons', async () => {
    const { container, getByText } = render(<WrapperComponent {...props} />)
    expect(getByText('cv.notifications.newNotificationRule')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('Verify if NotificationsContainer renders notificationsTable with data when there are notofications present', async () => {
    const newProps = { ...props, notificationsInTable: mockedNotificationsTable as NotificationRuleResponse[] }
    const { container, queryByText } = render(<WrapperComponent {...newProps} />)
    expect(queryByText('cv.notifications.newNotificationRule')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
