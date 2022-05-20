/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { ConnectorWizardContextProvider, useConnectorWizard } from '../ConnectorWizardContext'

jest.mock('@harness/help-panel', () => ({
  ...jest.requireActual('@harness/help-panel'),
  HelpPanel: () => 'help panel'
}))

const TestComponent: React.FC = () => {
  useConnectorWizard({
    helpPanel: {
      referenceId: 'testRef',
      contentWidth: 700
    }
  })
  return <div />
}

const TestComponentWithExtraWidth: React.FC = () => {
  useConnectorWizard({
    helpPanel: {
      referenceId: 'testRef',
      contentWidth: 1200
    }
  })
  return <div />
}

describe('connector wizard context test', () => {
  test('connector wizard context provider without help panel', () => {
    const { container } = render(<ConnectorWizardContextProvider>child</ConnectorWizardContextProvider>)
    const element = container.querySelector('[class*="createConnectorWizard"]')
    expect(element?.textContent).toEqual('child')
  })

  test('connector wizard context provider with help panel', () => {
    const { container } = render(
      <ConnectorWizardContextProvider>
        <TestComponent />
      </ConnectorWizardContextProvider>
    )
    expect(container.querySelector('[class*="helpPanelContainer"]')).toBeDefined()
  })

  test('connector wizard context provider with help panel', () => {
    const { container } = render(
      <ConnectorWizardContextProvider>
        <TestComponentWithExtraWidth />
      </ConnectorWizardContextProvider>
    )
    expect(container.querySelector('[class*="helpPanelContainer"]')).toBeDefined()
  })
})
