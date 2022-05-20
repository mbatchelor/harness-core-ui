/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, queryByAttribute } from '@testing-library/react'
import { Formik, FormikForm, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import RollbackStackInputStep from '../RollbackStackInputSteps'

const initialValues = {
  type: StepType.CloudFormationRollbackStack,
  name: 'test name',
  identifier: 'test_identifier',
  timeout: '10m',
  spec: {
    configuration: {
      provisionerIdentifier: RUNTIME_INPUT_VALUE
    }
  }
}

const renderComponent = (data: any) => {
  return render(
    <TestWrapper
      path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
      pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
    >
      <Formik initialValues={{}} onSubmit={() => undefined} formName="wrapperComponentTestForm">
        <FormikForm>
          <RollbackStackInputStep
            initialValues={initialValues as any}
            stepType={StepType.CloudFormationRollbackStack}
            stepViewType={StepViewType.InputSet}
            inputSetData={{
              template: data
            }}
            path="test"
            allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
          />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}

describe('Test cloudformation delete stack input set', () => {
  test('should render all input variables components', () => {
    const data = {
      type: StepType.CloudFormationRollbackStack,
      name: 'test name',
      identifier: 'test_identifier',
      timeout: '10m',
      spec: {
        configuration: {
          provisionerIdentifier: RUNTIME_INPUT_VALUE
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('timeout should be updated', () => {
    const data = {
      type: StepType.CloudFormationRollbackStack,
      name: 'test name',
      identifier: 'test_identifier',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        configuration: {
          provisionerIdentifier: RUNTIME_INPUT_VALUE
        }
      }
    }
    const { container, getByPlaceholderText } = renderComponent(data)

    const timeoutInput = getByPlaceholderText('Enter w/d/h/m/s/ms')
    fireEvent.change(timeoutInput!, { target: { value: '10m' } })

    expect(timeoutInput).toHaveDisplayValue('10m')
    expect(container).toMatchSnapshot()
  })

  test('provisionerIdentifier should be updated', () => {
    const data = {
      type: StepType.CloudFormationRollbackStack,
      name: 'test name',
      identifier: 'test_identifier',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        configuration: {
          provisionerIdentifier: RUNTIME_INPUT_VALUE
        }
      }
    }
    const { container } = renderComponent(data)
    const provId = queryByAttribute('name', container, 'test.spec.configuration.provisionerIdentifier')
    fireEvent.change(provId!, { target: { value: 'testID' } })
    expect(provId).toHaveDisplayValue('testID')
  })
})
