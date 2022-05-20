/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import {
  ConfigureSLOAlertConditionsProps,
  SRMNotificationType
} from '@cv/components/Notifications/NotificationsContainer.types'
import ConfigureSLOAlertConditions from '../ConfigureSLOAlertConditions'

const WrapperComponent = (props: ConfigureSLOAlertConditionsProps): JSX.Element => {
  return (
    <TestWrapper>
      <ConfigureSLOAlertConditions {...props} />
    </TestWrapper>
  )
}

describe('Unit tests for ConfigureSLOAlertConditions', () => {
  const props = {
    prevStepData: {
      type: SRMNotificationType.SERVICE_LEVEL_OBJECTIVE
    },
    nextStep: jest.fn(),
    previousStep: jest.fn()
  }
  test('Verify if ConfigureSLOAlertConditionsProps renders', async () => {
    const { getByText } = render(<WrapperComponent {...props} />)
    expect(getByText('cv.notifications.configureAlertConditions')).toBeInTheDocument()
    expect(getByText('Category: cv.SLO')).toBeInTheDocument()
    expect(getByText('cv.notifications.sloDescription')).toBeInTheDocument()
  })
})
