/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import HelpPanelProvider from 'framework/utils/HelpPanelProvider'
import { TestWrapper } from '@common/utils/testUtils'

jest.mock('@harness/help-panel', () => ({
  ...jest.requireActual('@harness/help-panel'),
  HelpPanelContextProvider: (props: any) => {
    return (
      <div>
        {props.accessToken}
        {props.children}
      </div>
    )
  }
}))

describe('help panel provider test', () => {
  test('test with feature flag disabled', () => {
    const { container } = render(<HelpPanelProvider>child</HelpPanelProvider>)
    expect(container).toHaveTextContent('child')
  })

  test('test with feature flag enabled', () => {
    window.helpPanelAccessToken = 'dummy_token'
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ featureFlags: { HELP_PANEL: true } }}>
        <HelpPanelProvider>child</HelpPanelProvider>
      </TestWrapper>
    )
    expect(container).toHaveTextContent('dummy_token')
  })
})
