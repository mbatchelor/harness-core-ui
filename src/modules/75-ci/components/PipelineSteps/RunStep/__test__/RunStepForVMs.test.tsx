/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, Matcher, waitFor } from '@testing-library/react'
import { findPopoverContainer } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { RunStep } from '../RunStep'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('../../CIStep/StepUtils', () => ({
  useGetPropagatedStageById: jest.fn(() => ({ stage: { spec: { infrastructure: { type: 'VM' } } } }))
}))

describe('Run Step view', () => {
  beforeAll(() => {
    factory.registerStep(new RunStep())
  })

  describe('Edit View', () => {
    test('should render properly for AWS VMs build infra', async () => {
      const { container, getByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.Run} stepViewType={StepViewType.Edit} />
      )

      expect(container).toMatchSnapshot()

      const lookupShouldFail = (text: Matcher) => {
        try {
          getByText(text)
        } catch (err) {
          expect(err).toBeTruthy()
        }
      }

      // ConnectorRef field look up should fail since this field is optional for AWS VMs Build Infra and won't be rendered without expanding optional config section
      lookupShouldFail('pipelineSteps.connectorLabel')
      // Image field look up should fail since this field is optional for AWS VMs Build Infra and won't be rendered without expanding optional config section
      lookupShouldFail('imageLabel')
      act(() => {
        fireEvent.click(getByText('common.optionalConfig'))
      })

      // Limit CPU field look up should fail since this field is not supported for AWS VMs Build Infra
      lookupShouldFail('pipelineSteps.limitCPULabel')
      // Limit Memory field look up should fail since this field is not supported for AWS VMs Build Infra
      lookupShouldFail('pipelineSteps.limitMemoryLabel')
      // Run as User field look up should fail since this field is not supported for AWS VMs Build Infra
      lookupShouldFail('pipeline.stepCommonFields.runAsUser')
      // Privileged field look up should fail since this field is not supported for AWS VMs Build Infra
      lookupShouldFail('ci.privileged')

      // ConnectorRef field renders under optional config section
      expect(getByText('pipelineSteps.connectorLabel')).toBeTruthy()
      // Image field renders under optional config section
      expect(getByText('imageLabel')).toBeTruthy()

      expect(getByText('common.shell')).toBeTruthy()
      const shellOptionsDropdownSelect = container.querySelector('[data-id="spec.shell-2"] [icon="chevron-down"]')!
      expect(shellOptionsDropdownSelect).toBeTruthy()
      await waitFor(() => {
        fireEvent.click(shellOptionsDropdownSelect)
        const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
        expect(menuItemLabels?.length).toEqual(4)
        expect(menuItemLabels?.[0].innerHTML).toEqual('common.bash')
        expect(menuItemLabels?.[1].innerHTML).toEqual('common.powershell')
        expect(menuItemLabels?.[2].innerHTML).toEqual('common.pwsh')
        expect(menuItemLabels?.[3].innerHTML).toEqual('common.sh')
      })
    })
  })
})
