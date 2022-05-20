/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor, findByText } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { noop } from 'lodash-es'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'

import { clickSubmit, fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { useCreateVariable, useUpdateVariable } from 'services/cd-ng'
import { StringFixedPayloadProj } from '@variables/utils/__tests__/mockConstants'
import useCreateEditVariableModal from '../useCreateEditVariableModal'

const pathParams = { accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }

jest.mock('services/cd-ng')
const useCreateVariableMock = useCreateVariable as jest.MockedFunction<any>
const useUpdateVariableMock = useUpdateVariable as jest.MockedFunction<any>
const createVariable = jest.fn().mockImplementationOnce(() => ({ status: 'SUCCESS' }))
useCreateVariableMock.mockImplementation(() => ({ mutate: createVariable }))
const updateVariable = jest.fn().mockReturnValueOnce({ status: 'SUCCESS' })
useUpdateVariableMock.mockReturnValue({ mutate: updateVariable })
describe('Test useCreateEditVariableModal', () => {
  const TestComponent = ({ onSuccess = noop, variable = undefined }: any) => {
    const { openCreateUpdateVariableModal, closeCreateUpdateVariableModal } = useCreateEditVariableModal({
      onSuccess: onSuccess
    })
    return (
      <>
        <div className={'useCreateEditVariableModalOpen'} onClick={() => openCreateUpdateVariableModal(variable)}></div>
        <div className={'useCreateEditVariableModalClose'} onClick={() => closeCreateUpdateVariableModal()}></div>
      </>
    )
  }
  test('should open useCreateEditVariableModal in create mode', async () => {
    const { container, getByText } = render(
      <TestWrapper path={routes.toVariables(projectPathProps)} pathParams={pathParams}>
        <TestComponent />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(container.querySelector('.useCreateEditVariableModalOpen')!)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
    const dialog = findDialogContainer() as HTMLElement
    const cancelBtn = await findByText(dialog, 'cancel')
    act(() => {
      fireEvent.click(cancelBtn)
    })
    expect(document.body.querySelector('.bp3-dialog')).toEqual(null)
  })
  test('should open useCreateEditVariableModal in create mode and close', async () => {
    const { container, getByText } = render(
      <TestWrapper path={routes.toVariables(accountPathProps)} pathParams={pathParams}>
        <TestComponent />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(container.querySelector('.useCreateEditVariableModalOpen')!)
    })

    await waitFor(() => expect(getByText('common.addVariable')))

    act(() => {
      fireEvent.click(container.querySelector('.useCreateEditVariableModalClose')!)
    })
    expect(document.body.querySelector('.bp3-dialog')).toEqual(null)
  })

  test('should open useCreateEditVariableModal in create mode and submit', async () => {
    const onSuccessMock = jest.fn()
    const { container, getByText } = render(
      <TestWrapper path={routes.toVariables(orgPathProps)} pathParams={pathParams}>
        <TestComponent onSuccess={onSuccessMock} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(container.querySelector('.useCreateEditVariableModalOpen')!)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
    const dialog = findDialogContainer() as HTMLElement
    await waitFor(() => dialog)

    fillAtForm([
      {
        container: dialog,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'dummy name'
      },
      {
        container: dialog,
        type: InputTypes.TEXTFIELD,
        fieldId: 'fixedValue',
        value: 'dummy fixedValue'
      }
    ])

    act(() => {
      clickSubmit(dialog)
    })

    await waitFor(() => expect(onSuccessMock).toBeCalled())

    await waitFor(() => expect(createVariable).toBeCalled())
  })

  test('should open useCreateEditVariableModal in edit mode', async () => {
    const { container, getByText } = render(
      <TestWrapper path={routes.toVariables(projectPathProps)} pathParams={pathParams}>
        <TestComponent variable={StringFixedPayloadProj} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(container.querySelector('.useCreateEditVariableModalOpen')!)
    })

    await waitFor(() => expect(getByText('variables.editVar')))
  })
})
