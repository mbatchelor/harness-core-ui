/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { get } from 'lodash-es'
import { render } from 'mustache'
import { validate, validateInputSet, Types } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'

const strings = {
  fieldRequired: '{{field}} is a required field',
  identifier: 'Identifier',
  imageLabel: 'Image',
  commandLabel: 'Command',
  pipelineSteps: {
    stepNameLabel: 'Step Name',
    connectorLabel: 'Container Registry'
  },
  validation: {
    validStepIdRegex: 'Identifier can only contain alphanumerics and _',
    validStepNameRegex: 'Step Name can only contain alphanumerics, spaces, _ and -',
    validKeyRegex: 'Keys can only contain alphanumerics and _ with an optional dot(.) in the middle',
    validOutputVariableRegex: 'Output variables can only contain alphanumerics and _',
    illegalIdentifier: 'common.invalidIdentifiers',
    uniqueStepAndServiceDependenciesId: 'Identifier should be unique across the steps and service dependencies',
    uniqueKeys: 'Keys should be unique',
    uniqueValues: 'Values should be unique',
    identifierRequired: 'validation.identifierRequired',
    validIdRegex: 'validation.validIdRegex'
  },
  common: {
    validation: {
      nameIsRequired: 'common.validation.nameIsRequired',
      namePatternIsNotValid: 'common.validation.namePatternIsNotValid',
      fieldIsRequired: 'common.validation.fieldIsRequired'
    },
    invalidIdentifiers: 'common.invalidIdentifiers'
  },
  pipeline: {
    stepCommonFields: {
      validation: {
        invalidLimitCPU: 'pipeline.stepCommonFields.validation.invalidLimitCPU',
        invalidLimitMemory: 'pipeline.stepCommonFields.validation.invalidLimitMemory'
      }
    }
  }
}

function getStringMock(key: string, vars: Record<string, any> = {}): string {
  const template = get(strings, key)

  if (typeof template !== 'string') {
    throw new Error(`No valid template with id "${key}" found in any namespace`)
  }

  return render(template, { ...vars, $: strings })
}

const editViewFieldsConfig = [
  {
    name: 'identifier',
    type: Types.Identifier,
    label: 'identifier',
    isRequired: true
  },
  {
    name: 'name',
    type: Types.Name,
    label: 'pipelineSteps.stepNameLabel',
    isRequired: true
  },
  {
    name: 'spec.connectorRef',
    type: Types.Text,
    label: 'pipelineSteps.connectorLabel',
    isRequired: true
  },
  {
    name: 'spec.image',
    type: Types.Text,
    label: 'imageLabel',
    isRequired: true
  },
  {
    name: 'spec.command',
    type: Types.Text,
    label: 'commandLabel',
    isRequired: true
  },
  {
    name: 'spec.reportPaths',
    type: Types.List
  },
  {
    name: 'spec.envVariables',
    type: Types.Map
  },
  {
    name: 'spec.outputVariables',
    type: Types.OutputVariables
  },
  {
    name: 'spec.limitMemory',
    type: Types.LimitMemory
  },
  {
    name: 'spec.limitCPU',
    type: Types.LimitCPU
  },
  {
    name: 'timeout',
    type: Types.Timeout
  }
]

const inputSetViewFieldsConfig = [
  {
    name: 'spec.connectorRef',
    type: Types.Text,
    label: 'pipelineSteps.connectorLabel',
    isRequired: true
  },
  {
    name: 'spec.image',
    type: Types.Text,
    label: 'imageLabel',
    isRequired: true
  },
  {
    name: 'spec.command',
    type: Types.Text,
    label: 'commandLabel',
    isRequired: true
  },
  {
    name: 'spec.reports.spec.paths',
    type: Types.List
  },
  {
    name: 'spec.envVariables',
    type: Types.Map
  },
  {
    name: 'spec.outputVariables',
    type: Types.OutputVariables
  },
  {
    name: 'spec.resources.limits.memory',
    type: Types.LimitMemory
  },
  {
    name: 'spec.resources.limits.cpu',
    type: Types.LimitCPU
  },
  {
    name: 'timeout',
    type: Types.Timeout
  }
]

const template = {
  identifier: 'Test_A',
  description: RUNTIME_INPUT_VALUE,
  timeout: RUNTIME_INPUT_VALUE,
  spec: {
    connectorRef: RUNTIME_INPUT_VALUE,
    image: RUNTIME_INPUT_VALUE,
    command: RUNTIME_INPUT_VALUE,
    reports: {
      spec: {
        paths: RUNTIME_INPUT_VALUE
      }
    },
    envVariables: RUNTIME_INPUT_VALUE,
    outputVariables: RUNTIME_INPUT_VALUE,
    resources: {
      limits: {
        cpu: RUNTIME_INPUT_VALUE,
        memory: RUNTIME_INPUT_VALUE
      }
    }
  }
}

describe('StepValidateUtils', () => {
  describe('validate', () => {
    test('should return errors for required fields', () => {
      const result = validate({}, editViewFieldsConfig, { getString: getStringMock }, StepViewType.Edit)

      expect(result).toEqual({
        identifier: 'Identifier is a required field',
        name: 'Step Name is a required field',
        spec: {
          connectorRef: 'Container Registry is a required field',
          image: 'Image is a required field',
          command: 'Command is a required field'
        }
      })
    })
  })

  describe('validateInputSet', () => {
    test('should return errors for required fields', () => {
      const result = validateInputSet(
        {},
        template,
        inputSetViewFieldsConfig,
        { getString: getStringMock },
        StepViewType.Edit
      )

      expect(result).toEqual({
        spec: {
          connectorRef: 'Container Registry is a required field',
          image: 'Image is a required field',
          command: 'Command is a required field'
        }
      })
    })

    test('should filter out fields that are not runtime inputs and not apply validation for them', () => {
      const result1 = validateInputSet(
        {},
        {},
        inputSetViewFieldsConfig,
        { getString: getStringMock },
        StepViewType.InputSet
      )
      expect(result1).toEqual({})

      const result2 = validateInputSet(
        {},
        { spec: { connectorRef: RUNTIME_INPUT_VALUE } },
        inputSetViewFieldsConfig,
        {
          getString: getStringMock
        },
        StepViewType.InputSet
      )
      expect(result2).toEqual({
        spec: {
          connectorRef: 'Container Registry is a required field'
        }
      })
    })
  })
})
