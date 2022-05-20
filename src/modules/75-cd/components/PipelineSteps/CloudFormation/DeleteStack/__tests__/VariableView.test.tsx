/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import { TestWrapper } from '@common/utils/testUtils'
import type { DeleteStackVariableStepProps } from '../../CloudFormationInterfaces.types'
import { DeleteStackVariableStep } from '../DeleteStackVariableView'
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const props = {
  initialValues: {
    type: StepType.CloudFormationDeleteStack,
    name: 'Test',
    identifier: 'Test',
    timeout: '10m',
    spec: {
      configuration: {
        type: 'test type',
        spec: {
          connectorRef: 'test ref',
          region: 'test region',
          roleArn: 'test role',
          stackName: 'test name',
          provisionerIdentifier: 'test_id'
        }
      }
    }
  },
  stageIdentifier: 'qaStage',
  onUpdate: jest.fn(),
  metadataMap: {},
  variablesData: {
    type: 'DeleteStack',
    name: 'cleanup',
    identifier: 'cleanup',
    spec: {
      configuration: {
        type: 'Inline',
        spec: {
          connectorRef: 'demo_aws',
          region: 'us-gov-west-1',
          roleArn: 'DatadogAWSIntegrationRole',
          stackName: 'stackName'
        }
      }
    },
    timeout: '10m'
  },
  stepType: StepType.CloudFormationDeleteStack
} as DeleteStackVariableStepProps

describe('Delete stack Variable view ', () => {
  test('initial render', () => {
    const { container } = render(
      <DeleteStackVariableStep
        initialValues={{
          type: StepType.CloudFormationDeleteStack,
          name: 'Test',
          identifier: 'Test',
          timeout: '10m',
          spec: {
            configuration: {
              type: 'test type',
              spec: {
                connectorRef: 'test ref',
                region: 'test region',
                roleArn: 'test role',
                stackName: 'test name',
                provisionerIdentifier: 'test_id'
              }
            }
          }
        }}
        {...{
          stageIdentifier: 'qaStage',
          metadataMap: props.metadataMap,
          variablesData: props.variablesData
        }}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('initial render inline with no values', () => {
    const { container } = render(
      <TestWrapper>
        <DeleteStackVariableStep
          initialValues={{
            type: StepType.CloudFormationDeleteStack,
            name: 'Test',
            identifier: 'Test',
            timeout: '10m',
            spec: {
              configuration: {
                type: 'test type',
                spec: {}
              }
            }
          }}
          {...{
            stageIdentifier: 'qaStage',
            metadataMap: props.metadataMap,
            variablesData: props.variablesData
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should render with inline config', () => {
    const { container } = render(
      <TestWrapper>
        <DeleteStackVariableStep {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
