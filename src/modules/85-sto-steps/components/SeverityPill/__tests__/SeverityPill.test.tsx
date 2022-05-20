/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { screen } from '@testing-library/dom'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import SeverityPill from '@sto-steps/components/SeverityPill/SeverityPill'
import { SeverityCode } from '@sto-steps/types'

describe('SeverityPill', () => {
  test('renders correctly', () => {
    const { container } = render(
      <TestWrapper getString={id => id}>
        <SeverityPill severity={SeverityCode.Critical} value={10} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('renders High', () => {
    render(
      <TestWrapper getString={id => id}>
        <SeverityPill severity={SeverityCode.High} value={7.5} />
      </TestWrapper>
    )
    expect(screen.getByText('connectors.cdng.verificationSensitivityLabel.high'))
    expect(screen.getByText('7.5'))
  })

  test('renders Medium', () => {
    render(
      <TestWrapper getString={id => id}>
        <SeverityPill severity={SeverityCode.Medium} value={5.5} />
      </TestWrapper>
    )
    expect(screen.getByText('connectors.cdng.verificationSensitivityLabel.medium'))
    expect(screen.getByText('5.5'))
  })

  test('renders Low', () => {
    render(
      <TestWrapper getString={id => id}>
        <SeverityPill severity={SeverityCode.Low} value={3.3} />
      </TestWrapper>
    )
    expect(screen.getByText('connectors.cdng.verificationSensitivityLabel.low'))
    expect(screen.getByText('3.3'))
  })

  test('renders Info', () => {
    render(
      <TestWrapper getString={id => id}>
        <SeverityPill severity={SeverityCode.Info} value={1.0} />
      </TestWrapper>
    )
    expect(screen.getByText('stoSteps.Info'))
    expect(screen.getByText('1'))
  })

  test('renders Unassigned', () => {
    render(
      <TestWrapper getString={id => id}>
        <SeverityPill severity={SeverityCode.Unassigned} value={5.0} />
      </TestWrapper>
    )
    expect(screen.getByText('stoSteps.Unassigned'))
    expect(screen.getByText('5'))
  })
})
