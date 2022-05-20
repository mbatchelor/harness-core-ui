/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { UseGetMockData } from '@common/utils/testUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type {
  ResponseConnectorResponse,
  ResponseListServiceNowFieldNG,
  ResponseListServiceNowTicketTypeDTO,
  ResponsePageConnectorResponse,
  ServiceNowFieldSchemaNG,
  ResponseListServiceNowTemplate
} from 'services/cd-ng'
import type { ServiceNowFieldsRendererProps } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/ServiceNowFieldsRenderer'
import type { ServiceNowCreateDeploymentModeProps, ServiceNowCreateStepModeProps } from '../types'
import { FieldType } from '../types'

export const getServiceNowCreateEditModeProps = (): ServiceNowCreateStepModeProps => ({
  initialValues: {
    name: '',
    identifier: '',
    type: 'ServiceNowCreate',
    timeout: '5s',
    spec: {
      connectorRef: '',
      ticketType: '',
      fields: [],
      fieldType: FieldType.ConfigureFields,
      useServiceNowTemplate: false
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getServiceNowCreateEditModePropsWithConnectorId = (): ServiceNowCreateStepModeProps => ({
  initialValues: {
    name: '',
    identifier: '',
    type: 'ServiceNowCreate',
    timeout: '5s',
    spec: {
      connectorRef: 'cid',
      ticketType: '',
      fields: [],
      fieldType: FieldType.ConfigureFields,
      useServiceNowTemplate: false
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getServiceNowCreateEditModePropsWithValues = (): ServiceNowCreateStepModeProps => ({
  initialValues: {
    name: '',
    identifier: '',
    type: 'ServiceNowCreate',
    timeout: '1d',
    spec: {
      useServiceNowTemplate: false,
      connectorRef: 'cid1',
      ticketType: 'INCIDENT',
      fieldType: FieldType.ConfigureFields,
      templateName: '<+input>',
      fields: [
        { name: 'f21', value: 'value1' },
        { name: 'f2', value: 2233 },
        { name: 'date', value: '23-march' },
        { name: 'short_description', value: 'short description' },
        { name: 'description', value: 'descriptionval' }
      ]
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getServiceNowCreateDeploymentModeProps = (): ServiceNowCreateDeploymentModeProps => ({
  stepViewType: StepViewType.InputSet,
  initialValues: {
    name: '',
    identifier: '',
    type: 'ServiceNowCreate',
    spec: {
      connectorRef: '',
      ticketType: '',
      fieldType: FieldType.ConfigureFields,
      useServiceNowTemplate: false,
      fields: [
        {
          name: 'description',
          value: ''
        },
        {
          name: 'short_description',
          value: ''
        }
      ]
    }
  },
  inputSetData: {
    path: '/ab/',
    template: {
      name: '',
      identifier: '',
      type: 'ServiceNowCreate',
      spec: {
        connectorRef: RUNTIME_INPUT_VALUE,
        ticketType: RUNTIME_INPUT_VALUE,
        fieldType: FieldType.ConfigureFields,
        useServiceNowTemplate: false,
        fields: [
          {
            name: 'description',
            value: RUNTIME_INPUT_VALUE
          },
          {
            name: 'short_description',
            value: RUNTIME_INPUT_VALUE
          }
        ]
      }
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
})

export const getServiceNowCreateInputVariableModeProps = () => ({
  initialValues: {
    spec: {}
  },
  customStepProps: {
    stageIdentifier: 'qaStage',
    metadataMap: {
      'step-name': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.name',
          localName: 'step.approval.name'
        }
      },
      'step-timeout': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.timeout',
          localName: 'step.approval.timeout'
        }
      },
      'step-connectorRef': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.connectorRef',
          localName: 'step.approval.spec.connectorRef'
        }
      },
      'step-ticketType': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.ticketType',
          localName: 'step.approval.spec.ticketType'
        }
      }
    },
    variablesData: {
      type: StepType.ServiceNowCreate,
      identifier: 'serviceNow_create',
      name: 'step-name',
      timeout: 'step-timeout',
      spec: {
        connectorRef: 'step-connectorRef',
        ticketType: 'step-ticketType'
      }
    }
  },
  onUpdate: jest.fn()
})

export const mockConnectorResponse: UseGetMockData<ResponseConnectorResponse> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: {
      connector: { name: 'c1', identifier: 'cid1', type: 'ServiceNow', spec: {} }
    }
  }
}

export const mockConnectorsResponse: ResponsePageConnectorResponse = {
  correlationId: 'someid',
  status: 'SUCCESS',
  metaData: null as unknown as undefined,
  data: {
    content: [
      { connector: { name: 'c1', identifier: 'cid1', type: 'ServiceNow', spec: {} } },
      { connector: { name: 'c2', identifier: 'cid2', type: 'ServiceNow', spec: {} } }
    ]
  }
}

export const mockServiceNowMetadataResponse: UseGetMockData<ResponseListServiceNowFieldNG> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: [
      {
        key: 'f1',
        name: 'f1',
        allowedValues: [],
        schema: {
          type: 'string' as ServiceNowFieldSchemaNG['type'],
          typeStr: ''
        }
      },
      {
        key: 'f2',
        name: 'f2',
        allowedValues: [
          {
            id: 'av1',
            name: 'av1',
            value: 'av1'
          },
          {
            id: 'av2',
            name: 'av2'
          }
        ],
        schema: {
          type: 'string' as ServiceNowFieldSchemaNG['type'],
          typeStr: ''
        }
      }
    ]
  }
}
export const getServiceNowFieldRendererProps = (): ServiceNowFieldsRendererProps => ({
  selectedFields: [
    {
      name: 'f2',
      value: { label: 'vb2', value: 'vb2' },
      key: 'f2',
      allowedValues: [],
      schema: {
        typeStr: '',
        type: 'string'
      }
    },
    {
      name: 'f3',
      value: [
        { label: 'v3', value: 'v3' },
        { label: 'v32', value: 'v32' }
      ],
      key: 'f3',
      allowedValues: [],
      schema: {
        typeStr: '',
        type: 'option'
      }
    }
  ],
  readonly: false,
  onDelete: jest.fn()
})
export const mockTicketTypesErrorResponse: ResponseListServiceNowTicketTypeDTO = {
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  error: {
    message: 'Failed to fetch: 400 Bad Request',
    data: {
      code: 'INVALID_REQUEST',
      correlationId: '',
      status: 'ERROR',
      metaData: null,
      message: 'mockMessage',
      responseMessages: [
        {
          code: 'INVALID_REQUEST',
          level: 'ERROR',
          message: 'mockMessage',
          exception: null,
          failureTypes: []
        }
      ]
    },
    status: '400'
  }
}

export const mockTicketTypeReponse: ResponseListServiceNowTicketTypeDTO = {
  // eslint-disable-next-line
  // @ts-ignore
  correlationId: '',
  status: 'SUCCESS',
  metaData: null as unknown as undefined,

  data: [
    {
      name: 'INCIDENT',
      key: 'incident'
    },
    {
      name: 'CHANGE',
      key: 'change'
    }
  ]
}
export const mockServiceNowTemplateResponse: UseGetMockData<ResponseListServiceNowTemplate> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: []
  }
}
