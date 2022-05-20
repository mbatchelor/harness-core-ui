/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import SLONotificationRuleRow from '../SLONotificationRuleRow'
import type { NotificationRuleRowProps } from '../SLONotificationRuleRow.types'

const WrapperComponent = (props: NotificationRuleRowProps): JSX.Element => {
  return (
    <TestWrapper>
      <SLONotificationRuleRow {...props} />
    </TestWrapper>
  )
}

describe('Unit tests for SLONotificationRuleRow', () => {
  const props = {
    notificationRule: {
      id: 'uuid-1',
      condition: null,
      changeType: [],
      duration: '1',
      lookBackDuration: '1',
      value: '1',
      threshold: '1'
    },
    showDeleteNotificationsIcon: true,
    handleChangeField: jest.fn(),
    handleDeleteNotificationRule: jest.fn()
  }

  test('Verify if SLONotificationRuleRow renders', async () => {
    const { getByText } = render(<WrapperComponent {...props} />)
    expect(getByText('cv.notifications.condition')).toBeInTheDocument()
  })

  test('should render the delete icon for every row', async () => {
    const newProps = { ...props, showDeleteNotificationsIcon: true }
    const { container } = render(<WrapperComponent {...newProps} />)
    const deleteInvite = container.querySelector('[data-icon="main-trash"]')
    expect(deleteInvite).toBeInTheDocument()
  })
})
