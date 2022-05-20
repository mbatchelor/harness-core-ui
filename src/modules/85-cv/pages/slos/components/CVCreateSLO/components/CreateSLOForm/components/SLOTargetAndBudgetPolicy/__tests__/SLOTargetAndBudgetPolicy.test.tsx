/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Formik } from 'formik'
import { FormikForm } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import {
  initialFormData,
  serviceLevelObjective
} from '@cv/pages/slos/components/CVCreateSLO/__tests__/CVCreateSLO.mock'
import type { StringKeys } from 'framework/strings'
import {
  getPeriodTypeOptions,
  getWindowEndOptionsForMonth,
  getErrorBudget,
  getPeriodLengthOptionsForRolling
} from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.utils'
import { PeriodLengthTypes, PeriodTypes } from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.types'
import SLOTargetAndBudgetPolicy from '../SLOTargetAndBudgetPolicy'

jest.mock('@cv/pages/slos/components/SLOTargetChart/SLOTargetChart', () => ({
  __esModule: true,
  default: function SLOTargetChart() {
    return <span data-testid="SLO-target-chart" />
  }
}))

jest.mock('services/cv', () => ({
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

function WrapperComponent(props: { initialValues: any }): JSX.Element {
  const { initialValues } = props
  return (
    <TestWrapper>
      <Formik enableReinitialize={true} initialValues={initialValues} onSubmit={jest.fn()}>
        {formikProps => {
          return (
            <FormikForm>
              <SLOTargetAndBudgetPolicy formikProps={formikProps} retryOnError={jest.fn()}>
                <></>
              </SLOTargetAndBudgetPolicy>
            </FormikForm>
          )
        }}
      </Formik>
    </TestWrapper>
  )
}

function getString(key: StringKeys): StringKeys {
  return key
}

describe('Test SLOTargetAndBudgetPolicy component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should render SLOTargetAndBudgetPolicy component', async () => {
    const { container } = render(<WrapperComponent initialValues={initialFormData} />)
    expect(screen.getByTestId('SLO-target-chart')).toBeInTheDocument()
    expect(container.querySelector('input[name="SLOTargetPercentage"]')).toHaveAttribute('step', 'any')
    expect(container).toMatchSnapshot()
  })

  test('verify getPeriodTypeOptions method', async () => {
    expect(getPeriodTypeOptions(getString)).toEqual([
      {
        label: 'cv.slos.sloTargetAndBudget.periodTypeOptions.rolling',
        value: 'Rolling'
      },
      {
        label: 'cv.slos.sloTargetAndBudget.periodTypeOptions.calendar',
        value: 'Calender'
      }
    ])
  })

  test('verify getWindowEndOptionsForMonth method', async () => {
    const periodLengthOptions = Array(31)
      .fill(0)
      .map((_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }))

    expect(getWindowEndOptionsForMonth()).toEqual(periodLengthOptions)
  })

  test('verify getPeriodLengthOptionsForRolling method', async () => {
    const periodLengthOptions = Array(31)
      .fill(0)
      .map((_, i) => ({ label: `${i + 1}`, value: `${i + 1}d` }))

    expect(getPeriodLengthOptionsForRolling()).toEqual(periodLengthOptions)
  })

  test('verify getErrorBudget', () => {
    expect(getErrorBudget(serviceLevelObjective)).toEqual(43200)
    expect(getErrorBudget({ ...serviceLevelObjective, SLOTargetPercentage: NaN })).toEqual(0)
    expect(getErrorBudget({ ...serviceLevelObjective, SLOTargetPercentage: -1 })).toEqual(0)
    expect(getErrorBudget({ ...serviceLevelObjective, SLOTargetPercentage: 101 })).toEqual(0)
    expect(getErrorBudget({ ...serviceLevelObjective, periodLength: 'NaN' })).toEqual(0)
    expect(
      getErrorBudget({
        ...serviceLevelObjective,
        periodType: PeriodTypes.CALENDAR,
        periodLengthType: PeriodLengthTypes.WEEKLY
      })
    ).toEqual(10080)
    expect(
      getErrorBudget({
        ...serviceLevelObjective,
        periodType: PeriodTypes.CALENDAR,
        periodLengthType: PeriodLengthTypes.MONTHLY
      })
    ).toEqual(43200)
    expect(
      getErrorBudget({
        ...serviceLevelObjective,
        periodType: PeriodTypes.CALENDAR,
        periodLengthType: PeriodLengthTypes.QUARTERLY
      })
    ).toEqual(129600)
  })
})
