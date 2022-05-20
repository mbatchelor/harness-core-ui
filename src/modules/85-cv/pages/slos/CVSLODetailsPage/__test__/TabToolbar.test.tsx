/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, RenderResult, screen, waitFor, getByText, queryByText } from '@testing-library/react'
import * as cvService from 'services/cv'
import routes from '@common/RouteDefinitions'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import {
  LogTypes,
  SLOLogContentProps,
  VerifyStepLogContentProps
} from '@cv/hooks/useLogContentHook/useLogContentHook.types'
import TabToolbar from '../DetailsPanel/views/TabToolbar'
import { testWrapperProps, responseSLODashboardDetail, pathParams } from './CVSLODetailsPage.mock'
import { SLODetailsPageTabIds } from '../CVSLODetailsPage.types'

jest.mock('@cv/hooks/useLogContentHook/views/VerifyStepLogContent', () => ({
  __esModule: true,
  default: function VerifyStepLogContent(props: VerifyStepLogContentProps) {
    return <div>{props.logType}</div>
  }
}))

jest.mock('@cv/hooks/useLogContentHook/views/SLOLogContent', () => ({
  __esModule: true,
  default: function SLOLogContent(props: SLOLogContentProps) {
    return <div>{props.logType}</div>
  }
}))

const { sloDashboardWidget } = responseSLODashboardDetail.data ?? {}
const deleteSLO = jest.fn()
const onTabChange = jest.fn()
const resetErrorBudget = jest.fn()
const refetchSLODetails = jest.fn()

const renderComponent = (): RenderResult => {
  return render(
    <TestWrapper {...testWrapperProps}>
      {sloDashboardWidget && (
        <TabToolbar
          deleteSLO={deleteSLO}
          onTabChange={onTabChange}
          resetErrorBudget={resetErrorBudget}
          refetchSLODetails={refetchSLODetails}
          sloDashboardWidget={sloDashboardWidget}
        />
      )}
    </TestWrapper>
  )
}

describe('TabToolbar', () => {
  test('it should call the onTabChange by clicking on Edit', () => {
    renderComponent()

    userEvent.click(screen.getByText('edit'))

    expect(onTabChange).toHaveBeenCalledWith(SLODetailsPageTabIds.Configurations)
  })

  test('it should successfully reset the error budget', async () => {
    jest.spyOn(cvService, 'resetErrorBudgetPromise').mockReturnValue(null as any)

    renderComponent()

    userEvent.click(screen.getByText('cv.resetErrorBudget'))

    const dialogContainer = findDialogContainer()

    expect(getByText(dialogContainer!, 'cv.resetErrorBudget')).toBeInTheDocument()

    setFieldValue({
      container: dialogContainer!,
      type: InputTypes.TEXTFIELD,
      fieldId: 'errorBudgetIncrementMinutes',
      value: '100'
    })

    setFieldValue({
      container: dialogContainer!,
      type: InputTypes.TEXTAREA,
      fieldId: 'reason',
      value: 'REASON'
    })

    userEvent.click(getByText(dialogContainer!, 'save'))

    await waitFor(() => {
      expect(queryByText(dialogContainer!, 'cv.resetErrorBudget')).not.toBeInTheDocument()
    })

    const confirmationDialogContainer = findDialogContainer()

    await waitFor(() => {
      expect(getByText(confirmationDialogContainer!, 'cv.slos.reviewChanges')).toBeInTheDocument()
    })

    userEvent.click(getByText(confirmationDialogContainer!, 'common.ok'))

    await waitFor(() => {
      expect(resetErrorBudget).toBeCalledWith(
        {
          errorBudgetAtReset: 101,
          errorBudgetIncrementMinutes: 100,
          reason: 'REASON',
          remainingErrorBudgetAtReset: -1124
        },
        { pathParams: { identifier: 'Server_Error_Rate' } }
      )
    })
  })

  test('it should open the LogContent modal and render SLOLogContent with type ExecutionLog by clicking on Execution Logs', async () => {
    renderComponent()

    userEvent.click(screen.getByText('cv.executionLogs'))

    await waitFor(() => {
      expect(screen.getByText(LogTypes.ExecutionLog)).toBeInTheDocument()
      expect(screen.queryByText(LogTypes.ApiCallLog)).not.toBeInTheDocument()
    })
  })

  test('it should open the LogContent modal and render SLOLogContent with type ApiCallLog by clicking on External API Calls', async () => {
    renderComponent()

    userEvent.click(screen.getByText('cv.externalAPICalls'))

    await waitFor(() => {
      expect(screen.getByText(LogTypes.ApiCallLog)).toBeInTheDocument()
      expect(screen.queryByText(LogTypes.ExecutionLog)).not.toBeInTheDocument()
    })
  })

  test('it should delete the SLO and redirects to the SLO listing page', async () => {
    jest.spyOn(cvService, 'deleteSLODataPromise').mockReturnValue(null as any)

    renderComponent()

    userEvent.click(screen.getByText('delete'))

    const dialogContainer = findDialogContainer()

    expect(getByText(dialogContainer!, 'delete')).toBeInTheDocument()

    userEvent.click(getByText(dialogContainer!, 'delete'))

    const { accountId, orgIdentifier, projectIdentifier } = pathParams

    expect(deleteSLO).toBeCalledWith('Server_Error_Rate')

    await waitFor(() => {
      expect(screen.getByText(routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier }))).toBeInTheDocument()
    })
  })

  test('it should delete the SLO and redirects to the Monitored Service details page', async () => {
    const monitoredServiceIdentifier = 'Service_1_Environment_1'
    jest.spyOn(cvService, 'deleteSLODataPromise').mockReturnValue(null as any)

    render(
      <TestWrapper {...testWrapperProps} queryParams={{ monitoredServiceIdentifier }}>
        {sloDashboardWidget && (
          <TabToolbar
            deleteSLO={deleteSLO}
            onTabChange={onTabChange}
            resetErrorBudget={resetErrorBudget}
            refetchSLODetails={refetchSLODetails}
            sloDashboardWidget={sloDashboardWidget}
          />
        )}
      </TestWrapper>
    )

    userEvent.click(screen.getByText('delete'))

    const dialogContainer = findDialogContainer()

    expect(getByText(dialogContainer!, 'delete')).toBeInTheDocument()

    userEvent.click(getByText(dialogContainer!, 'delete'))

    const { accountId, orgIdentifier, projectIdentifier } = pathParams

    await waitFor(() => {
      expect(
        screen.getByText(
          routes.toCVAddMonitoringServicesEdit({
            accountId,
            orgIdentifier,
            projectIdentifier,
            identifier: monitoredServiceIdentifier
          })
        )
      ).toBeInTheDocument()
    })
  })
})
