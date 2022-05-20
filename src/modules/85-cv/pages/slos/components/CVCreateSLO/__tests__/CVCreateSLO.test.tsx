/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, RenderResult } from '@testing-library/react'
import * as cvServices from 'services/cv'
import routes from '@common/RouteDefinitions'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import { TestWrapper } from '@common/utils/testUtils'
import { getCVMonitoringServicesSearchParam } from '@cv/utils/CommonUtils'
import { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import CVCreateSLO from '../CVCreateSLO'
import { createSLORequestPayload } from '../CVCreateSLO.utils'
import { Comparators, PeriodLengthTypes, PeriodTypes, SLOFormFields } from '../CVCreateSLO.types'
import {
  testWrapperProps,
  userJourneyResponse,
  monitoredServiceWithHealthSourcesResponse,
  listMetricDTOResponse,
  SLOResponse,
  serviceLevelObjective,
  pathParams,
  testWrapperPropsForEdit,
  SLOResponseForCalenderType
} from './CVCreateSLO.mock'

const refetchServiceLevelObjective = jest.fn()

jest.mock('services/cv', () => ({
  useSaveSLOData: jest.fn().mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useUpdateSLOData: jest
    .fn()
    .mockImplementation(() => ({ mutate: jest.fn(), loading: false, error: null, refetch: jest.fn() })),
  useGetServiceLevelObjective: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() } as any)),
  useGetAllJourneys: jest
    .fn()
    .mockImplementation(() => ({ data: userJourneyResponse, loading: false, error: null, refetch: jest.fn() })),
  useSaveUserJourney: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useGetAllMonitoredServicesWithTimeSeriesHealthSources: jest.fn().mockImplementation(() => {
    return { data: monitoredServiceWithHealthSourcesResponse, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetSloMetrics: jest
    .fn()
    .mockImplementation(() => ({ data: listMetricDTOResponse, loading: false, error: null, refetch: jest.fn() })),
  useGetSliGraph: jest.fn().mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useGetMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useGetNotificationRulesForSLO: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useSaveNotificationRuleData: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useUpdateNotificationRuleData: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() }))
}))

const renderComponent = (): RenderResult => {
  return render(
    <TestWrapper {...testWrapperProps}>
      <CVCreateSLO />
    </TestWrapper>
  )
}

describe('CVCreateSLO', () => {
  test('it should render breadcrumb, create title and name tab by default', () => {
    renderComponent()

    expect(screen.getByText('cv.slos.title')).toBeInTheDocument()
    expect(screen.getByText('cv.slos.createSLO')).toBeInTheDocument()
    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')
  })

  test('it should not trigger the GET API for Service Level Objective)', () => {
    renderComponent()

    expect(refetchServiceLevelObjective).not.toHaveBeenCalled()
  })

  test('it should validate Name nad SLI form fields', async () => {
    const { container } = renderComponent()

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('continue'))

    await waitFor(() => {
      expect(screen.getByText('cv.slos.validations.nameValidation')).toBeInTheDocument()
      expect(screen.getByText('cv.slos.validations.userJourneyRequired')).toBeInTheDocument()
    })

    await setFieldValue({ container, type: InputTypes.TEXTFIELD, fieldId: SLOFormFields.NAME, value: 'Text SLO' })

    userEvent.click(screen.getByPlaceholderText('cv.slos.userJourneyPlaceholder'))

    await waitFor(() => {
      expect(screen.getByText('User Journey 1')).toBeInTheDocument()
      userEvent.click(screen.getByText('User Journey 1'))
    })

    await waitFor(() => {
      expect(screen.queryByText('cv.slos.validations.nameValidation')).not.toBeInTheDocument()
      expect(screen.queryByText('cv.slos.validations.userJourneyRequired')).not.toBeInTheDocument()
      expect(screen.getByText('connectors.cdng.validations.monitoringServiceRequired')).toBeInTheDocument()
    })

    userEvent.click(screen.getByText('continue'))

    await waitFor(() => expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true'))

    expect(container.querySelector('input[name="objectiveValue"]')).toHaveAttribute('step', 'any')

    userEvent.click(screen.getByText('continue'))

    await waitFor(() => {
      expect(screen.getByText('cv.slos.validations.healthSourceRequired')).toBeInTheDocument()
      expect(screen.getAllByText('cv.required')).toHaveLength(3)
      expect(screen.getAllByText('cv.metricIsRequired')).toHaveLength(2)
    })
  })

  test('it should validate form fields for tab change and allow to go back on prev tabs', async () => {
    const { container } = renderComponent()

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('cv.slos.sli'))

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    await waitFor(() => expect(screen.getByText('cv.slos.validations.nameValidation')).toBeInTheDocument())
    await waitFor(() =>
      expect(screen.getByText('connectors.cdng.validations.monitoringServiceRequired')).toBeInTheDocument()
    )

    userEvent.click(screen.getByText('cv.slos.sloTargetAndBudgetPolicy'))

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    await setFieldValue({ container, type: InputTypes.TEXTFIELD, fieldId: SLOFormFields.NAME, value: 'Text SLO' })

    userEvent.click(screen.getByPlaceholderText('cv.slos.userJourneyPlaceholder'))

    await waitFor(() => {
      expect(screen.getByText('User Journey 1')).toBeInTheDocument()
      userEvent.click(screen.getByText('User Journey 1'))
    })

    userEvent.click(screen.getByText('cv.slos.sli'))

    expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('name'))

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('cv.slos.sloTargetAndBudgetPolicy'))

    expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true')
  })

  test('it should render correct labels based on event type Good or Bad', async () => {
    const { container } = renderComponent()

    await setFieldValue({ container, type: InputTypes.TEXTFIELD, fieldId: SLOFormFields.NAME, value: 'Text SLO' })

    userEvent.click(screen.getByPlaceholderText('cv.slos.userJourneyPlaceholder'))

    await waitFor(() => {
      expect(screen.getByText('User Journey 1')).toBeInTheDocument()
      userEvent.click(screen.getByText('User Journey 1'))
    })

    userEvent.click(screen.getByText('continue'))

    expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true')

    expect(screen.getByText('cv.slos.slis.ratioMetricType.eventType')).toBeInTheDocument()
    expect(screen.getByText('cv.slos.slis.ratioMetricType.goodRequestsMetrics')).toBeInTheDocument()

    userEvent.click(container.querySelector('input[name="eventType"]')!)
    userEvent.click(screen.getByText('cv.bad'))

    expect(screen.getByText('cv.slos.slis.ratioMetricType.badRequestsMetrics')).toBeInTheDocument()

    userEvent.click(container.querySelector('input[name="eventType"]')!)
    userEvent.click(screen.getByText('cv.good'))

    expect(screen.getByText('cv.slos.slis.ratioMetricType.goodRequestsMetrics')).toBeInTheDocument()
  })
})

const renderEditComponent = (): RenderResult => {
  return render(
    <TestWrapper {...testWrapperPropsForEdit}>
      <CVCreateSLO />
    </TestWrapper>
  )
}

describe('CVCreateSLO - Edit', () => {
  beforeEach(() => {
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: jest.fn() } as any))
  })

  test('it should not render header in case of Edit', () => {
    renderEditComponent()

    expect(screen.queryByText('cv.slos.title')).not.toBeInTheDocument()
    expect(screen.queryByText('cv.slos.createSLO')).not.toBeInTheDocument()
    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')
  })

  test('it should trigger the GET API for Service Level Objective)', () => {
    const fetchSLO = jest.fn()
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: fetchSLO } as any))

    renderEditComponent()

    expect(fetchSLO).toHaveBeenCalled()
  })

  test('it should render all steps and update the SLO', async () => {
    const fetchSLO = jest.fn()
    const updateSLO = jest.fn()
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: fetchSLO } as any))
    jest
      .spyOn(cvServices, 'useUpdateSLOData')
      .mockReturnValue({ mutate: updateSLO, loading: false, error: null } as any)

    renderEditComponent()

    expect(fetchSLO).toHaveBeenCalled()

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('continue'))

    await waitFor(() => expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true'))

    userEvent.click(screen.getByText('continue'))

    await waitFor(() =>
      expect(screen.getByText('cv.slos.sloTargetAndBudgetPolicy')).toHaveAttribute('aria-selected', 'true')
    )

    userEvent.click(screen.getByText('save'))

    await waitFor(() => {
      expect(updateSLO).toBeCalledWith(
        createSLORequestPayload(serviceLevelObjective, pathParams.orgIdentifier, pathParams.projectIdentifier)
      )
      expect(screen.getByText('cv.slos.sloUpdated')).toBeInTheDocument()
    })

    expect(screen.getByText(routes.toCVSLOs({ ...pathParams }))).toBeInTheDocument()
  })

  test('it should update the SLO and redirect to the MS details page', async () => {
    const fetchSLO = jest.fn()
    const updateSLO = jest.fn()
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: fetchSLO } as any))
    jest
      .spyOn(cvServices, 'useUpdateSLOData')
      .mockReturnValue({ mutate: updateSLO, loading: false, error: null } as any)

    render(
      <TestWrapper
        {...testWrapperPropsForEdit}
        queryParams={{
          monitoredServiceIdentifier: 'monitored_service_identifier'
        }}
      >
        <CVCreateSLO />
      </TestWrapper>
    )

    expect(fetchSLO).toHaveBeenCalled()

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('continue'))

    await waitFor(() => expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true'))

    userEvent.click(screen.getByText('continue'))

    await waitFor(() =>
      expect(screen.getByText('cv.slos.sloTargetAndBudgetPolicy')).toHaveAttribute('aria-selected', 'true')
    )

    userEvent.click(screen.getByText('save'))

    await waitFor(() => {
      expect(updateSLO).toBeCalledWith(
        createSLORequestPayload(serviceLevelObjective, pathParams.orgIdentifier, pathParams.projectIdentifier)
      )
      expect(screen.getAllByText('cv.slos.sloUpdated')[0]).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        routes.toCVAddMonitoringServicesEdit({ ...pathParams, identifier: 'monitored_service_identifier' }) +
          getCVMonitoringServicesSearchParam({ tab: MonitoredServiceEnum.SLOs })
      )
    ).toBeInTheDocument()
  })

  test('it should redirect to the SLO listing page by clicking on Back button', async () => {
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: jest.fn() } as any))

    render(
      <TestWrapper {...testWrapperPropsForEdit}>
        <CVCreateSLO />
      </TestWrapper>
    )

    userEvent.click(screen.getByText('continue'))
    userEvent.click(screen.getByText('continue'))

    userEvent.click(screen.getByText('back'))
    userEvent.click(screen.getByText('back'))
    userEvent.click(screen.getByText('back'))

    expect(screen.getByText(routes.toCVSLOs({ ...pathParams }))).toBeInTheDocument()
  })

  test('it should redirect to the MS details page by clicking on Back button', async () => {
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: jest.fn() } as any))

    render(
      <TestWrapper
        {...testWrapperPropsForEdit}
        queryParams={{
          monitoredServiceIdentifier: 'monitored_service_identifier'
        }}
      >
        <CVCreateSLO />
      </TestWrapper>
    )

    userEvent.click(screen.getByText('back'))

    expect(
      screen.getByText(
        routes.toCVAddMonitoringServicesEdit({ ...pathParams, identifier: 'monitored_service_identifier' }) +
          getCVMonitoringServicesSearchParam({ tab: MonitoredServiceEnum.SLOs })
      )
    ).toBeInTheDocument()
  })

  test('+ New Health Source should should open the drawer to add a new health source', () => {
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: jest.fn() } as any))

    render(
      <TestWrapper
        {...testWrapperPropsForEdit}
        queryParams={{
          monitoredServiceIdentifier: 'monitored_service_identifier'
        }}
      >
        <CVCreateSLO />
      </TestWrapper>
    )

    userEvent.click(screen.getByText('continue'))

    userEvent.click(
      screen.getByRole('button', {
        name: /cv.healthSource.newHealthSource/i
      })
    )

    expect(screen.getByText('cv.healthSource.addHealthSource')).toBeInTheDocument()
  })

  test('+ New Metric should open the health source drawer in edit mode', () => {
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: jest.fn() } as any))

    render(
      <TestWrapper
        {...testWrapperPropsForEdit}
        queryParams={{
          monitoredServiceIdentifier: 'monitored_service_identifier'
        }}
      >
        <CVCreateSLO />
      </TestWrapper>
    )

    userEvent.click(screen.getByText('continue'))
    expect(screen.getAllByText('cv.newMetric')[0]).toBeEnabled()
  })

  test('it should not render Event type and Good request metric dropdowns for Threshold based', () => {
    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(() => ({ data: SLOResponse, loading: false, error: null, refetch: jest.fn() } as any))

    renderEditComponent()

    userEvent.click(screen.getByText('continue'))

    expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true')

    const ratioMetricRadio = screen.getByRole('radio', {
      name: /cv.slos.slis.metricOptions.ratioBased/i,
      hidden: true
    })

    expect(ratioMetricRadio).toBeChecked()
    expect(screen.getByText('cv.slos.slis.ratioMetricType.eventType')).toBeInTheDocument()
    expect(screen.getByText('cv.slos.slis.ratioMetricType.goodRequestsMetrics')).toBeInTheDocument()

    const thresholdMetricRadio = screen.getByRole('radio', {
      name: /cv.slos.slis.metricOptions.thresholdBased/i,
      hidden: true
    })

    userEvent.click(thresholdMetricRadio)

    expect(thresholdMetricRadio).toBeChecked()
    expect(screen.queryByText('cv.slos.slis.ratioMetricType.eventType')).not.toBeInTheDocument()
    expect(screen.queryByText('cv.slos.slis.ratioMetricType.goodRequestsMetrics')).not.toBeInTheDocument()
  })

  test('it should render suffix than for operators < and >', async () => {
    const { container } = renderEditComponent()

    userEvent.click(screen.getByText('continue'))

    expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true')

    await setFieldValue({
      container,
      type: InputTypes.SELECT,
      fieldId: SLOFormFields.OBJECTIVE_COMPARATOR,
      value: Comparators.LESS
    })

    expect(screen.getByText('cv.thanObjectiveValue')).toBeInTheDocument()
    expect(screen.queryByText('cv.toObjectiveValue')).not.toBeInTheDocument()
  })

  test('it should render suffix to for operators <= and >=', async () => {
    const { container } = renderEditComponent()

    userEvent.click(screen.getByText('continue'))

    expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true')

    await setFieldValue({
      container,
      type: InputTypes.SELECT,
      fieldId: SLOFormFields.OBJECTIVE_COMPARATOR,
      value: Comparators.LESS_EQUAL
    })

    expect(screen.getByText('cv.toObjectiveValue')).toBeInTheDocument()
    expect(screen.queryByText('cv.thanObjectiveValue')).not.toBeInTheDocument()
  })

  test('it should render period length days for period type rolling', async () => {
    renderEditComponent()

    userEvent.click(screen.getByText('continue'))
    userEvent.click(screen.getByText('continue'))

    expect(screen.getByText('cv.slos.sloTargetAndBudgetPolicy')).toHaveAttribute('aria-selected', 'true')

    expect(screen.getByText('cv.periodLengthDays')).toBeInTheDocument()
    expect(screen.queryByText('cv.periodLength')).not.toBeInTheDocument()
  })

  test('it should render all steps and update the SLO for type Calender', async () => {
    const fetchSLO = jest.fn()
    const updateSLO = jest.fn()

    jest
      .spyOn(cvServices, 'useGetServiceLevelObjective')
      .mockImplementation(
        () => ({ data: SLOResponseForCalenderType, loading: false, error: null, refetch: fetchSLO } as any)
      )

    jest
      .spyOn(cvServices, 'useUpdateSLOData')
      .mockReturnValue({ mutate: updateSLO, loading: false, error: null } as any)

    renderEditComponent()

    expect(fetchSLO).toHaveBeenCalled()

    expect(screen.getByText('name')).toHaveAttribute('aria-selected', 'true')

    userEvent.click(screen.getByText('continue'))

    await waitFor(() => expect(screen.getByText('cv.slos.sli')).toHaveAttribute('aria-selected', 'true'))

    userEvent.click(screen.getByText('continue'))

    await waitFor(() =>
      expect(screen.getByText('cv.slos.sloTargetAndBudgetPolicy')).toHaveAttribute('aria-selected', 'true')
    )

    userEvent.click(screen.getByText('save'))

    await waitFor(() => {
      expect(updateSLO).toHaveBeenLastCalledWith(
        createSLORequestPayload(
          {
            ...serviceLevelObjective,
            periodType: PeriodTypes.CALENDAR,
            periodLengthType: PeriodLengthTypes.QUARTERLY,
            periodLength: undefined
          },
          pathParams.orgIdentifier,
          pathParams.projectIdentifier
        )
      )
    })

    expect(screen.getByText(routes.toCVSLOs({ ...pathParams }))).toBeInTheDocument()
  })
})
