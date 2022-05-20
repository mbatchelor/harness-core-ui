/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, getByText, waitFor, queryByText } from '@testing-library/react'
import routes from '@common/RouteDefinitions'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import { getSearchString } from '@cv/utils/CommonUtils'
import {
  LogTypes,
  SLOLogContentProps,
  VerifyStepLogContentProps
} from '@cv/hooks/useLogContentHook/useLogContentHook.types'
import { SLODetailsPageTabIds } from '@cv/pages/slos/CVSLODetailsPage/CVSLODetailsPage.types'
import { PeriodTypes } from '../components/CVCreateSLO/CVCreateSLO.types'
import SLOCardHeader from '../SLOCard/SLOCardHeader'
import type { SLOCardHeaderProps } from '../CVSLOsListingPage.types'
import { testWrapperProps, pathParams, dashboardWidgetsContent } from './CVSLOsListingPage.mock'

jest.mock('@cv/hooks/useLogContentHook/views/VerifyStepLogContent', () => ({
  __esModule: true,
  default: (props: VerifyStepLogContentProps) => <div>{props.logType}</div>
}))

jest.mock('@cv/hooks/useLogContentHook/views/SLOLogContent', () => ({
  __esModule: true,
  default: (props: SLOLogContentProps) => <div>{props.logType}</div>
}))

const ComponentWrapper: React.FC<Optional<SLOCardHeaderProps>> = ({
  serviceLevelObjective = dashboardWidgetsContent,
  onDelete = jest.fn(),
  onResetErrorBudget = jest.fn(),
  ...rest
}) => {
  return (
    <TestWrapper {...testWrapperProps}>
      <SLOCardHeader
        serviceLevelObjective={serviceLevelObjective}
        onDelete={onDelete}
        onResetErrorBudget={onResetErrorBudget}
        {...rest}
      />
    </TestWrapper>
  )
}

describe('SLOCardHeader', () => {
  test('Render sample card', () => {
    const { container } = render(<ComponentWrapper />)

    expect(screen.getByText(dashboardWidgetsContent.title)).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('Without monitoredServiceIdentifier, Options button should be rendered', () => {
    const { container } = render(<ComponentWrapper />)

    expect(container.querySelector('[data-icon="Options"]')).toBeInTheDocument()
  })

  test('edit should go to edit page', async () => {
    const { container } = render(<ComponentWrapper />)

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    expect(document.querySelector('[icon="edit"]')).toBeInTheDocument()

    userEvent.click(document.querySelector('[icon="edit"]')!)

    expect(
      screen.getByText(
        routes.toCVSLODetailsPage({ ...pathParams, identifier: dashboardWidgetsContent.sloIdentifier }) +
          getSearchString({ tab: SLODetailsPageTabIds.Configurations })
      )
    ).toBeInTheDocument()
  })

  test('it should have monitored service identifier query param when edit from MS details page', () => {
    const { container } = render(<ComponentWrapper monitoredServiceIdentifier="monitored_service_identifier" />)

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    expect(document.querySelector('[icon="edit"]')).toBeInTheDocument()

    userEvent.click(document.querySelector('[icon="edit"]')!)

    expect(
      screen.getByText(
        routes.toCVSLODetailsPage({ ...pathParams, identifier: dashboardWidgetsContent.sloIdentifier }) +
          getSearchString({
            tab: SLODetailsPageTabIds.Configurations,
            monitoredServiceIdentifier: 'monitored_service_identifier'
          })
      )
    ).toBeInTheDocument()
  })

  test('delete should show the conformation dialog', async () => {
    const onDelete = jest.fn()

    const { container } = render(<ComponentWrapper onDelete={onDelete} />)

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    const popover = findPopoverContainer()

    expect(getByText(popover!, 'delete')).toBeInTheDocument()

    userEvent.click(getByText(popover!, 'delete'))

    const dialogContainer = findDialogContainer()

    expect(getByText(dialogContainer!, 'delete')).toBeInTheDocument()

    userEvent.click(getByText(dialogContainer!, 'delete'))

    expect(onDelete).toBeCalledWith(dashboardWidgetsContent.sloIdentifier, dashboardWidgetsContent.title)
  })

  test('monitored service should go to Service Health tab', () => {
    render(<ComponentWrapper />)

    expect(screen.getByText(dashboardWidgetsContent.serviceName as string)).toBeInTheDocument()

    userEvent.click(screen.getByText(dashboardWidgetsContent.serviceName as string))

    expect(
      screen.getByText(
        routes.toCVAddMonitoringServicesEdit({
          ...pathParams,
          identifier: dashboardWidgetsContent.monitoredServiceIdentifier,
          module: 'cv'
        })
      )
    ).toBeInTheDocument()
  })

  test('it should not render Reset Error Budget menu item for Rolling type', () => {
    const { container } = render(<ComponentWrapper />)

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    const popover = findPopoverContainer()

    expect(queryByText(popover!, 'cv.resetErrorBudget')).not.toBeInTheDocument()
  })

  test('it should successfully reset the error budget', async () => {
    const onResetErrorBudget = jest.fn()

    const { container } = render(
      <ComponentWrapper
        serviceLevelObjective={{ ...dashboardWidgetsContent, sloTargetType: PeriodTypes.CALENDAR }}
        onResetErrorBudget={onResetErrorBudget}
      />
    )

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    const popover = findPopoverContainer()

    expect(getByText(popover!, 'cv.resetErrorBudget')).toBeInTheDocument()

    userEvent.click(getByText(popover!, 'cv.resetErrorBudget'))

    const dialogContainer = findDialogContainer()

    expect(getByText(dialogContainer!, 'cv.resetErrorBudget')).toBeInTheDocument()

    userEvent.click(getByText(dialogContainer!, 'save'))

    await waitFor(() => {
      expect(screen.getByText('cv.increaseErrorBudgetByIsRequired')).toBeInTheDocument()
      expect(screen.getByText('cv.reasonIsRequired')).toBeInTheDocument()
    })

    setFieldValue({
      container: dialogContainer!,
      type: InputTypes.TEXTFIELD,
      fieldId: 'errorBudgetIncrementMinutes',
      value: '0'
    })

    await waitFor(() => {
      expect(screen.queryByText('cv.increaseErrorBudgetByIsRequired')).not.toBeInTheDocument()
      expect(screen.getByText('common.validation.valueMustBeGreaterThanOrEqualToN')).toBeInTheDocument()
    })

    setFieldValue({
      container: dialogContainer!,
      type: InputTypes.TEXTFIELD,
      fieldId: 'errorBudgetIncrementMinutes',
      value: '101'
    })

    await waitFor(() => {
      expect(screen.queryByText('common.validation.valueMustBeGreaterThanOrEqualToN')).not.toBeInTheDocument()
    })

    setFieldValue({
      container: dialogContainer!,
      type: InputTypes.TEXTAREA,
      fieldId: 'reason',
      value: 'REASON'
    })

    await waitFor(() => {
      expect(screen.queryByText('common.validation.valueMustBeLessThanOrEqualToN')).not.toBeInTheDocument()
      expect(screen.queryByText('cv.reasonIsRequired')).not.toBeInTheDocument()
    })

    expect(dialogContainer).toMatchSnapshot()

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
      expect(onResetErrorBudget).toBeCalledWith(dashboardWidgetsContent.sloIdentifier, {
        errorBudgetAtReset: 100,
        errorBudgetIncrementMinutes: 101,
        reason: 'REASON',
        remainingErrorBudgetAtReset: 60
      })
    })
  })

  test('should open the LogContent modal and render VerifyStepLog with type ExecutionLog by clicking the Execution Logs button', async () => {
    const { container } = render(<ComponentWrapper />)

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    const popover = findPopoverContainer()
    expect(getByText(popover!, 'cv.executionLogs')).toBeInTheDocument()

    userEvent.click(getByText(popover!, 'cv.executionLogs'))

    const dialog = findDialogContainer()

    await waitFor(() => {
      expect(screen.getByText(LogTypes.ExecutionLog)).toBeInTheDocument()
      expect(screen.queryByText(LogTypes.ApiCallLog)).not.toBeInTheDocument()
    })

    userEvent.click(dialog?.querySelector('[data-icon="Stroke"]')!)
  })

  test('should open the LogContent modal and render VerifyStepLog with type ApiCallLog by clicking the Execution Logs button', async () => {
    const { container } = render(<ComponentWrapper />)

    userEvent.click(container.querySelector('[data-icon="Options"]')!)

    const popover = findPopoverContainer()
    expect(getByText(popover!, 'cv.externalAPICalls')).toBeInTheDocument()

    userEvent.click(getByText(popover!, 'cv.externalAPICalls'))

    const dialog = findDialogContainer()

    await waitFor(() => {
      expect(screen.getByText(LogTypes.ApiCallLog)).toBeInTheDocument()
      expect(screen.queryByText(LogTypes.ExecutionLog)).not.toBeInTheDocument()
    })

    userEvent.click(dialog?.querySelector('[data-icon="Stroke"]')!)
  })
})
