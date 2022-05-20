/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { act, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import useTestConnectionErrorModal from '@connectors/common/useTestConnectionErrorModal/useTestConnectionErrorModal'
import errorData from './connectorError.json'

const WrapperComponent = (): React.ReactElement => {
  const { openErrorModal } = useTestConnectionErrorModal({
    onClose: jest.fn(),
    connectorInfo: {
      name: 'Bfdfdsfsf',
      identifier: 'fdfdsfdsf',
      description: '',
      tags: {},
      type: 'Github',
      spec: {
        url: 'https://github.com/fdsfdsf',
        validationRepo: null,
        authentication: {
          type: 'Http',
          spec: {
            type: 'UsernameToken',
            spec: { username: 'fdfdsfdfdsf', usernameRef: null, tokenRef: 'account.dfdfdfd' }
          }
        },
        apiAccess: { type: 'Token', spec: { tokenRef: 'account.dfdfdsfdsffdfd' } },
        delegateSelectors: [],
        executeOnDelegate: false,
        type: 'Repo'
      }
    },
    showCustomErrorSuggestion: true
  })
  const onBtnClick = () => {
    openErrorModal(errorData as any)
  }

  return <button className="openModal" onClick={onBtnClick} />
}

describe('Test case for test connection error modal', () => {
  test('should work as expected', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <WrapperComponent />
      </TestWrapper>
    )

    const openModal = container.querySelector('.openModal')
    await act(async () => {
      fireEvent.click(openModal!)
    })

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    expect(getByText('errorDetails')).toBeDefined()
    expect(modal).toMatchSnapshot()
  })
})
