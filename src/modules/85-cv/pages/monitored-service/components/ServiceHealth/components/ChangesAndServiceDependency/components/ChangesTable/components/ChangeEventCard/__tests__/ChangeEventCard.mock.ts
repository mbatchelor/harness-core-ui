/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const payload = {
  metaData: {},
  resource: {
    id: 'rZc13AsoT1CZigLguBXZaw',
    accountId: 'kmpySmUISimoRrJL6NL73w',
    orgIdentifier: 'CVNG',
    projectIdentifier: 'DemoDataProject',
    serviceIdentifier: 'service1',
    monitoredServiceIdentifier: 'monitored_service_identifier',
    serviceName: 'service1',
    envIdentifier: 'prod',
    environmentName: 'prod',
    name: 'A little bump in the road',
    changeSourceIdentifier: 'pagerduty',
    eventTime: 1601664322169,
    metadata: {
      eventId: 'PGR0VU2',
      pagerDutyUrl: 'https://api.pagerduty.com/incidents/PGR0VU2',
      title: 'A little bump in the road',
      status: 'triggered',
      triggeredAt: 1601664322.169,
      urgency: 'high',
      htmlUrl: 'https://acme.pagerduty.com/incidents/PGR0VU2',
      priority: 'P2',
      assignment: null,
      assignmentUrl: null,
      escalationPolicy: 'Default',
      escalationPolicyUrl: 'https://acme.pagerduty.com/escalation_policies/PUS0KTE'
    },
    category: 'Alert',
    type: 'PagerDuty'
  },
  responseMessages: []
}

export const HarnessNextGenMockData = {
  metaData: {},
  resource: {
    id: 'FHj1QjXMTNySJF2mz4d5Bw',
    accountId: 'kmpySmUISimoRrJL6NL73w',
    orgIdentifier: 'default',
    projectIdentifier: 'DevProject',
    serviceIdentifier: 'service1',
    monitoredServiceIdentifier: 'monitored_service_identifier',
    serviceName: 'service1',
    envIdentifier: 'env1',
    environmentName: 'env1',
    name: 'CD Nextgen - service1 - test',
    changeSourceIdentifier: 'cdNg',
    eventTime: 1633853633448,
    metadata: {
      deploymentStartTime: 1633853330350,
      deploymentEndTime: 1633853633448,
      planExecutionId: 'ZW6KNATYQYmn1MdScWBmbQ',
      pipelineId: 'DemoData',
      stageStepId: 'YIya827mTBSol-5ItBhCVA',
      stageId: 'Demo',
      artifactType: null,
      artifactTag: null,
      status: 'ABORTED',
      verifyStepSummaries: [
        {
          name: 'verify_prod',
          verificationStatus: 'VERIFICATION_PASSED'
        },
        {
          name: 'verify_dev',
          verificationStatus: 'VERIFICATION_FAILED'
        }
      ],
      pipelinePath:
        '/account/kmpySmUISimoRrJL6NL73w/cd/orgs/default/projects/DevProject/pipelines/DemoData/executions/ZW6KNATYQYmn1MdScWBmbQ/pipeline?stage=YIya827mTBSol-5ItBhCVA'
    },
    category: 'Deployment' as any,
    type: 'HarnessCDNextGen' as any
  },
  responseMessages: []
}
export const HarnessNextGenMockDataWithoutMetadata = {
  metaData: {
    pipelinePath: 'https://harness.io'
  },
  resource: {
    id: 'FHj1QjXMTNySJF2mz4d5Bw',
    accountId: 'kmpySmUISimoRrJL6NL73w',
    orgIdentifier: 'default',
    projectIdentifier: 'DevProject',
    serviceIdentifier: 'service1',
    monitoredServiceIdentifier: 'monitored_service_identifier',
    serviceName: 'service1',
    envIdentifier: 'env1',
    environmentName: 'env1',
    name: 'CD Nextgen - service1 - test',
    changeSourceIdentifier: 'cdNg',
    eventTime: 1633853633448,
    metadata: {},
    category: 'Deployment' as any,
    type: 'HarnessCDNextGen' as any
  },

  responseMessages: []
}

export const HarnessCDMockData = {
  metaData: {},
  resource: {
    id: 'fWjG6GwTSN-HtyqsgK564g',
    accountId: 'kmpySmUISimoRrJL6NL73w',
    orgIdentifier: 'default',
    projectIdentifier: 'Harshil',
    serviceIdentifier: 'service300',
    monitoredServiceIdentifier: 'monitored_service_identifier',
    serviceName: 'service-300',
    envIdentifier: 'Env100',
    environmentName: 'Env-100',
    name: 'Deployment of service300 in Env100',
    changeSourceIdentifier: 'Harness_CD_change_source',
    eventTime: 1633961702460,
    metadata: {
      accountId: 'kmpySmUISimoRrJL6NL73w',
      appId: 'iMIH7_pKT3CZliTdpajMNA',
      serviceId: '06AAbdrjT8i1vABnuShL_Q',
      environmentId: '06AAbdrjT8i1vABnuShL_Q',
      workflowId: 'JL-tAhDPRp6hwqxFueTnDQ',
      workflowStartTime: 1633961702460,
      workflowEndTime: 1633962499782,
      workflowExecutionId: 'c9yNq_htSLSYISZG9HFxRw',
      name: 'To-Do List K8s Canary'
    },
    category: 'Deployment',
    type: 'HarnessCD'
  },
  responseMessages: []
}
