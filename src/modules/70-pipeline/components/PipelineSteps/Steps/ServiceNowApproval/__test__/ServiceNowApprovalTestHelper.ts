/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { UseGetMockData } from '@common/utils/testUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type {
  ResponseConnectorResponse,
  ResponseListServiceNowFieldNG,
  ResponsePageConnectorResponse,
  ResponseListServiceNowTicketTypeDTO
} from 'services/cd-ng'
import { ApprovalRejectionCriteriaType } from '@pipeline/components/PipelineSteps/Steps/Common/types'
import type { ServiceNowApprovalStepModeProps, SnowApprovalDeploymentModeProps } from '../types'
import { getDefaultCriterias } from '../helper'

export const getServiceNowApprovalEditModeProps = (): ServiceNowApprovalStepModeProps => ({
  initialValues: {
    timeout: '5s',
    name: '',
    type: StepType.ServiceNowApproval,
    identifier: '',
    spec: {
      connectorRef: '',
      ticketType: '',
      ticketNumber: '',
      approvalCriteria: getDefaultCriterias(),
      rejectionCriteria: getDefaultCriterias()
    }
  },
  onUpdate: jest.fn(),
  stepViewType: StepViewType.Edit,
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getServiceNowApprovalEditModePropsWithValues = (): ServiceNowApprovalStepModeProps => ({
  initialValues: {
    timeout: '10m',
    name: '',
    type: StepType.ServiceNowApproval,
    identifier: '',
    spec: {
      connectorRef: 'c1d1',
      ticketType: 'pid1',
      ticketNumber: 'itd1',
      approvalCriteria: {
        type: ApprovalRejectionCriteriaType.KeyValues,
        spec: {
          matchAnyCondition: true,
          conditions: [
            {
              key: 'state',
              operator: 'in',
              value: 'Done,todo'
            },
            {
              key: 'f1',
              operator: 'equals',
              value: 'somevalue for f1'
            }
          ]
        }
      },
      rejectionCriteria: {
        type: ApprovalRejectionCriteriaType.Jexl,
        spec: {
          expression: "<+state> == 'Blocked'"
        }
      }
    }
  },
  onUpdate: jest.fn(),
  onChange: jest.fn(),
  stepViewType: StepViewType.Edit,
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getServiceNowApprovalDeploymentModeProps = (): SnowApprovalDeploymentModeProps => ({
  stepViewType: StepViewType.InputSet,
  initialValues: {
    name: '',
    type: StepType.ServiceNowApproval,
    identifier: '',
    spec: {
      connectorRef: '',
      ticketType: '',
      ticketNumber: '',
      approvalCriteria: getDefaultCriterias(),
      rejectionCriteria: getDefaultCriterias()
    }
  },
  inputSetData: {
    path: '/ab/',
    template: {
      name: '',
      type: StepType.ServiceNowApproval,
      identifier: '',
      spec: {
        connectorRef: RUNTIME_INPUT_VALUE,

        ticketType: RUNTIME_INPUT_VALUE,
        ticketNumber: RUNTIME_INPUT_VALUE,
        approvalCriteria: getDefaultCriterias(),
        rejectionCriteria: getDefaultCriterias()
      }
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getServiceNowApprovalInputVariableModeProps = () => ({
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
      },
      'step-ticketNumber': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.ticketNumber',
          localName: 'step.approval.spec.ticketNumber'
        }
      }
    },
    variablesData: {
      type: StepType.ServiceNowApproval,
      identifier: 'serviceNow_approval',
      name: 'step-name',
      description: 'Description',
      timeout: 'step-timeout',
      spec: {
        connectorRef: 'step-connectorRef',
        ticketNumber: 'step-ticketNumber',
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
      connector: { name: 'c1', identifier: 'c1d1', type: 'ServiceNow', spec: {} }
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

export const mockTicketTypesResponse: UseGetMockData<ResponseListServiceNowTicketTypeDTO> = {
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
        key: 'pid1',
        name: 'p1'
      },
      {
        key: 'pid2',
        name: 'p2'
      },
      {
        key: 'pid3',
        name: 'p3'
      }
    ]
  }
}
export const mockServiceNowCreateMetadataResponse: UseGetMockData<ResponseListServiceNowFieldNG> = {
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
        key: 'parent',
        name: 'Parent',
        required: false,
        schema: { array: undefined, customType: undefined, type: 'string', typeStr: '' },
        allowedValues: [],
        custom: false
      },
      {
        key: 'made_sla',
        name: 'Made SLA',
        required: false,
        schema: { array: undefined, customType: undefined, type: 'string', typeStr: '' },
        allowedValues: [],
        custom: false
      },
      {
        key: 'caused_by',
        name: 'Caused by Change',
        required: false,
        schema: { array: undefined, customType: undefined, type: 'string', typeStr: '' },
        allowedValues: [],
        custom: false
      },
      {
        key: 'watch_list',
        name: 'Watch list',
        required: false,
        schema: { array: undefined, customType: undefined, type: 'string', typeStr: '' },
        allowedValues: [],
        custom: false
      },
      {
        key: 'upon_reject',
        name: 'Upon reject',
        required: false,
        schema: { array: undefined, customType: undefined, type: 'string', typeStr: '' },
        allowedValues: [],
        custom: false
      },
      {
        key: 'sys_updated_on',
        name: 'updated',
        required: false,
        schema: { array: undefined, customType: undefined, type: 'string', typeStr: '' },
        allowedValues: [],
        custom: false
      }
    ]
  }
}

export const ConnectorsResponse = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      content: [
        {
          connector: {
            name: 'cp-snow',
            identifier: 'cpsnow',
            description: '',
            orgIdentifier: 'harness',
            projectIdentifier: 'test',
            tags: {},
            type: 'ServiceNow',
            spec: {
              serviceNowUrl: 'https://abc.com',
              username: 'admin',
              usernameRef: null,
              passwordRef: '',
              delegateSelectors: []
            }
          }
        }
      ]
    }
  }
}
