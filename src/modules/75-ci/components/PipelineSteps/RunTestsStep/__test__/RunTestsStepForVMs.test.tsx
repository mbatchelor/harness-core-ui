/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { findPopoverContainer } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { RunTestsStep } from '../RunTestsStep'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('../../CIStep/StepUtils', () => ({
  useGetPropagatedStageById: jest.fn(() => ({ stage: { spec: { infrastructure: { type: 'VM' } } } }))
}))

describe('RunTests Step', () => {
  beforeAll(() => {
    factory.registerStep(new RunTestsStep())
  })

  describe('Edit View', () => {
    test('should render properly for AWS VMs build infra', async () => {
      const { container, getByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.RunTests} stepViewType={StepViewType.Edit} />
      )

      expect(container).toMatchSnapshot()

      act(() => {
        fireEvent.click(getByText('common.optionalConfig'))
      })

      const dropdownSelects = container.querySelectorAll('[icon="chevron-down"]')
      // Shell dropdown should only be visible for AWS VMs Build Infra
      expect(dropdownSelects.length).toEqual(5)

      await waitFor(() => {
        fireEvent.click(dropdownSelects[0])
        const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
        expect(menuItemLabels?.length).toEqual(2)
        // Csharp option should only be visible for AWS VMs Build Infra
        expect(menuItemLabels?.[0].innerHTML).toEqual('Csharp')
        expect(menuItemLabels?.[1].innerHTML).toEqual('Java')
      })

      expect(getByText('common.shell')).toBeTruthy()
      expect(dropdownSelects[4]).toBeTruthy()
    })
  })
})
