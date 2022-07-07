/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import * as cdngServices from 'services/cd-ng'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { FlagConfigurationStep } from '../FlagConfigurationStep'
import { mockSetFlagSwitchFieldValues } from '../FlagChanges/subSections/__tests__/utils.mocks'
// import type { useGetFeatureFlag } from 'services/cf'

jest.mock('services/cf', () => ({
  useGetAllFeatures: jest
    .fn()
    .mockReturnValue({ data: { features: [{ identifier: 'f1', name: 'f1' }] }, loading: false, reload: jest.fn() }),
  useGetFeatureFlag: jest
    .fn()
    .mockReturnValue({ data: { identifier: 'f1', name: 'f1' }, loading: false, reload: jest.fn() })
}))

jest.mock('../FlagChanges/FlagChangesForm', () => ({
  __esModule: true,
  default: () => <span />
}))

describe('FlagConfigurationStep', () => {
  beforeEach(() => {
    jest.spyOn(cdngServices, 'useGetEnvironmentList').mockReturnValue({
      data: { data: { content: [{ environment: { name: 'e1', identifier: 'e1' } }] } },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    factory.registerStep(new FlagConfigurationStep())
  })

  describe('StepViewType.Edit', () => {
    test('it should render in edit mode', async () => {
      const { container } = render(
        <TestStepWidget
          initialValues={{
            identifier: 'test123',
            name: 'Test 123',
            type: StepType.FlagConfiguration,
            spec: {}
          }}
          type={StepType.FlagConfiguration}
          stepViewType={StepViewType.Edit}
        />
      )

      expect(container).toMatchSnapshot()
    })

    test('it should render disabled in edit mode', async () => {
      const { container } = render(
        <TestStepWidget
          initialValues={{
            identifier: 'test123',
            name: 'Test 123',
            type: StepType.FlagConfiguration,
            spec: {}
          }}
          readonly
          type={StepType.FlagConfiguration}
          stepViewType={StepViewType.Edit}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('StepViewType.DeploymentForm', () => {
    test('it should render in DeploymentForm mode', async () => {
      const { container } = render(
        <TestStepWidget
          initialValues={{}}
          path="stages[0].stage.spec.execution.steps[0].step"
          allValues={{ spec: { environment: 'e1', feature: 'f1' } }}
          template={{ spec: { instructions: RUNTIME_INPUT_VALUE } }}
          type={StepType.FlagConfiguration}
          stepViewType={StepViewType.DeploymentForm}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('StepViewType.InputVariable', () => {
    test('it should render in InputVariable mode', async () => {
      const { container } = render(
        <TestStepWidget
          initialValues={mockSetFlagSwitchFieldValues('on')}
          type={StepType.FlagConfiguration}
          stepViewType={StepViewType.InputVariable}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })
})
