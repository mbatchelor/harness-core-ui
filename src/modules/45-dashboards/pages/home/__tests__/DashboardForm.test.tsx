/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { useStrings } from 'framework/strings'
import * as customDashboardServices from 'services/custom-dashboards'
import DashboardForm, { DashboardFormProps } from '../DashboardForm'

const defaultProps: DashboardFormProps = {
  title: '',
  loading: false,
  onComplete: jest.fn(),
  setModalErrorHandler: jest.fn()
}

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)

const { result } = renderHook(() => useStrings(), { wrapper })

const renderComponent = (props: DashboardFormProps): RenderResult => {
  return render(
    <TestWrapper>
      <DashboardForm {...props} />
    </TestWrapper>
  )
}

const mockEmptyGetFolderResponse: customDashboardServices.GetFolderResponse = {
  resource: []
}

describe('DashboardForm', () => {
  beforeEach(() => {
    jest
      .spyOn(customDashboardServices, 'useGetFolder')
      .mockImplementation(() => ({ data: mockEmptyGetFolderResponse, loading: false } as any))
  })
  afterEach(() => {
    jest.spyOn(customDashboardServices, 'useGetFolder').mockReset()
  })

  test('it should display a Dashboard Form with continue button', () => {
    renderComponent(defaultProps)

    const saveButton = screen.getByText(result.current.getString('continue'))
    waitFor(() => expect(saveButton).toBeInTheDocument())
  })
})
