/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const servicesCall =
  '/ng/api/services?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1'

export const environmentsCall =
  '/ng/api/environments?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1'

export const servicesResponse = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 100,
    content: [
      {
        accountId: 'zEaak-FLS425IEO7OLzMUg',
        identifier: 'Service_101',
        orgIdentifier: 'default',
        projectIdentifier: 'TestHealth',
        name: 'Service 101',
        description: null,
        deleted: false,
        tags: {},
        version: 0
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: null,
  correlationId: '8fc77312-0015-4665-be3d-f66527ae209f'
}

export const environmentResponse = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 100,
    content: [
      {
        accountId: 'zEaak-FLS425IEO7OLzMUg',
        orgIdentifier: 'default',
        projectIdentifier: 'TestHealth',
        identifier: 'QA',
        name: 'QA',
        description: '',
        color: '#0063F7',
        type: 'PreProduction',
        deleted: false,
        tags: {},
        version: 0
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: null,
  correlationId: '76f1288e-9bd0-47c0-82d9-6a3df8084603'
}

export const environmentistCall =
  '/cv/api/monitored-service/environments?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1'

export const monitoredServiceListCall =
  '/cv/api/monitored-service?routingId=accountId&offset=0&pageSize=10&accountId=accountId&orgIdentifier=default&projectIdentifier=project1&servicesAtRiskFilter=false'

export const monitoredServiceListResponse = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 10,
    content: [
      {
        name: 'service1_env1',
        identifier: 'service1_env1',
        serviceRef: 'service1',
        environmentRef: 'env1',
        environmentRefList: null,
        serviceName: 'service-1',
        environmentName: 'env-1',
        type: 'Application',
        healthMonitoringEnabled: true,
        currentHealthScore: {
          healthScore: null,
          riskStatus: 'NO_DATA',
          startTime: 0,
          endTime: 0,
          timeRangeParams: null
        },
        dependentHealthScore: [],
        historicalTrend: {
          healthScores: [
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643535000000,
              endTime: 1643536800000,
              timeRangeParams: { startTime: 1643535000.0, endTime: 1643536800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643536800000,
              endTime: 1643538600000,
              timeRangeParams: { startTime: 1643536800.0, endTime: 1643538600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643538600000,
              endTime: 1643540400000,
              timeRangeParams: { startTime: 1643538600.0, endTime: 1643540400.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643540400000,
              endTime: 1643542200000,
              timeRangeParams: { startTime: 1643540400.0, endTime: 1643542200.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643542200000,
              endTime: 1643544000000,
              timeRangeParams: { startTime: 1643542200.0, endTime: 1643544000.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643544000000,
              endTime: 1643545800000,
              timeRangeParams: { startTime: 1643544000.0, endTime: 1643545800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643545800000,
              endTime: 1643547600000,
              timeRangeParams: { startTime: 1643545800.0, endTime: 1643547600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643547600000,
              endTime: 1643549400000,
              timeRangeParams: { startTime: 1643547600.0, endTime: 1643549400.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643549400000,
              endTime: 1643551200000,
              timeRangeParams: { startTime: 1643549400.0, endTime: 1643551200.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643551200000,
              endTime: 1643553000000,
              timeRangeParams: { startTime: 1643551200.0, endTime: 1643553000.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643553000000,
              endTime: 1643554800000,
              timeRangeParams: { startTime: 1643553000.0, endTime: 1643554800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643554800000,
              endTime: 1643556600000,
              timeRangeParams: { startTime: 1643554800.0, endTime: 1643556600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643556600000,
              endTime: 1643558400000,
              timeRangeParams: { startTime: 1643556600.0, endTime: 1643558400.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643558400000,
              endTime: 1643560200000,
              timeRangeParams: { startTime: 1643558400.0, endTime: 1643560200.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643560200000,
              endTime: 1643562000000,
              timeRangeParams: { startTime: 1643560200.0, endTime: 1643562000.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643562000000,
              endTime: 1643563800000,
              timeRangeParams: { startTime: 1643562000.0, endTime: 1643563800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643563800000,
              endTime: 1643565600000,
              timeRangeParams: { startTime: 1643563800.0, endTime: 1643565600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643565600000,
              endTime: 1643567400000,
              timeRangeParams: { startTime: 1643565600.0, endTime: 1643567400.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643567400000,
              endTime: 1643569200000,
              timeRangeParams: { startTime: 1643567400.0, endTime: 1643569200.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643569200000,
              endTime: 1643571000000,
              timeRangeParams: { startTime: 1643569200.0, endTime: 1643571000.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643571000000,
              endTime: 1643572800000,
              timeRangeParams: { startTime: 1643571000.0, endTime: 1643572800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643572800000,
              endTime: 1643574600000,
              timeRangeParams: { startTime: 1643572800.0, endTime: 1643574600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643574600000,
              endTime: 1643576400000,
              timeRangeParams: { startTime: 1643574600.0, endTime: 1643576400.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643576400000,
              endTime: 1643578200000,
              timeRangeParams: { startTime: 1643576400.0, endTime: 1643578200.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643578200000,
              endTime: 1643580000000,
              timeRangeParams: { startTime: 1643578200.0, endTime: 1643580000.0 }
            },
            {
              healthScore: 0,
              riskStatus: 'UNHEALTHY',
              startTime: 1643580000000,
              endTime: 1643581800000,
              timeRangeParams: { startTime: 1643580000.0, endTime: 1643581800.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643581800000,
              endTime: 1643583600000,
              timeRangeParams: { startTime: 1643581800.0, endTime: 1643583600.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643583600000,
              endTime: 1643585400000,
              timeRangeParams: { startTime: 1643583600.0, endTime: 1643585400.0 }
            },
            {
              healthScore: 0,
              riskStatus: 'UNHEALTHY',
              startTime: 1643585400000,
              endTime: 1643587200000,
              timeRangeParams: { startTime: 1643585400.0, endTime: 1643587200.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643587200000,
              endTime: 1643589000000,
              timeRangeParams: { startTime: 1643587200.0, endTime: 1643589000.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643589000000,
              endTime: 1643590800000,
              timeRangeParams: { startTime: 1643589000.0, endTime: 1643590800.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643590800000,
              endTime: 1643592600000,
              timeRangeParams: { startTime: 1643590800.0, endTime: 1643592600.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643592600000,
              endTime: 1643594400000,
              timeRangeParams: { startTime: 1643592600.0, endTime: 1643594400.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643594400000,
              endTime: 1643596200000,
              timeRangeParams: { startTime: 1643594400.0, endTime: 1643596200.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643596200000,
              endTime: 1643598000000,
              timeRangeParams: { startTime: 1643596200.0, endTime: 1643598000.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643598000000,
              endTime: 1643599800000,
              timeRangeParams: { startTime: 1643598000.0, endTime: 1643599800.0 }
            },
            {
              healthScore: 0,
              riskStatus: 'UNHEALTHY',
              startTime: 1643599800000,
              endTime: 1643601600000,
              timeRangeParams: { startTime: 1643599800.0, endTime: 1643601600.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643601600000,
              endTime: 1643603400000,
              timeRangeParams: { startTime: 1643601600.0, endTime: 1643603400.0 }
            },
            {
              healthScore: 100,
              riskStatus: 'HEALTHY',
              startTime: 1643603400000,
              endTime: 1643605200000,
              timeRangeParams: { startTime: 1643603400.0, endTime: 1643605200.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643605200000,
              endTime: 1643607000000,
              timeRangeParams: { startTime: 1643605200.0, endTime: 1643607000.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643607000000,
              endTime: 1643608800000,
              timeRangeParams: { startTime: 1643607000.0, endTime: 1643608800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643608800000,
              endTime: 1643610600000,
              timeRangeParams: { startTime: 1643608800.0, endTime: 1643610600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643610600000,
              endTime: 1643612400000,
              timeRangeParams: { startTime: 1643610600.0, endTime: 1643612400.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643612400000,
              endTime: 1643614200000,
              timeRangeParams: { startTime: 1643612400.0, endTime: 1643614200.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643614200000,
              endTime: 1643616000000,
              timeRangeParams: { startTime: 1643614200.0, endTime: 1643616000.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643616000000,
              endTime: 1643617800000,
              timeRangeParams: { startTime: 1643616000.0, endTime: 1643617800.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643617800000,
              endTime: 1643619600000,
              timeRangeParams: { startTime: 1643617800.0, endTime: 1643619600.0 }
            },
            {
              healthScore: null,
              riskStatus: 'NO_DATA',
              startTime: 1643619600000,
              endTime: 1643621400000,
              timeRangeParams: { startTime: 1643619600.0, endTime: 1643621400.0 }
            }
          ]
        },
        changeSummary: {
          categoryCountMap: {
            Alert: { count: 0, countInPrecedingWindow: 0 },
            Deployment: { count: 0, countInPrecedingWindow: 0 },
            Infrastructure: { count: 0, countInPrecedingWindow: 0 }
          }
        },
        tags: {},
        sloHealthIndicators: null
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: null,
  correlationId: 'a46d9c2d-848b-43fd-9e47-01160161053a'
}

export const dataforMS = {
  status: 'SUCCESS',
  data: {
    createdAt: 1642157779711,
    lastModifiedAt: 1643278935584,
    monitoredService: {
      orgIdentifier: 'default',
      projectIdentifier: 'project1',
      identifier: 'service1_env1',
      name: 'service1_env1',
      type: 'Application',
      description: '',
      serviceRef: 'service1',
      environmentRef: 'env1',
      environmentRefList: null,
      tags: {},
      sources: {
        healthSources: [
          {
            name: 'AppD Edit Mode',
            identifier: 'dadadass',
            type: 'AppDynamics',
            spec: {
              connectorRef: 'appdtest',
              feature: 'Application Monitoring',
              applicationName: 'cv-app',
              tierName: 'docker-tier',
              metricPacks: [{ identifier: 'Performance' }, { identifier: 'Errors' }],
              metricDefinitions: [
                {
                  identifier: 'appdMetric_101',
                  metricName: 'appdMetric 101',
                  riskProfile: { category: 'Errors', metricType: null, thresholdTypes: [] },
                  analysis: {
                    liveMonitoring: { enabled: false },
                    deploymentVerification: {
                      enabled: false,
                      serviceInstanceFieldName: null,
                      serviceInstanceMetricPath: null
                    },
                    riskProfile: { category: 'Errors', metricType: null, thresholdTypes: [] }
                  },
                  sli: { enabled: true },
                  groupName: 'Group 1',
                  baseFolder: 'Overall Application Performance',
                  metricPath: 'Calls per Minute'
                },
                {
                  identifier: 'appdMetric_10',
                  metricName: 'appdMetric 10',
                  riskProfile: { category: 'Errors', metricType: 'ERROR', thresholdTypes: ['ACT_WHEN_HIGHER'] },
                  analysis: {
                    liveMonitoring: { enabled: true },
                    deploymentVerification: {
                      enabled: false,
                      serviceInstanceFieldName: null,
                      serviceInstanceMetricPath: null
                    },
                    riskProfile: { category: 'Errors', metricType: 'ERROR', thresholdTypes: ['ACT_WHEN_HIGHER'] }
                  },
                  sli: { enabled: true },
                  groupName: 'Group 2',
                  baseFolder: 'Overall Application Performance',
                  metricPath: 'Calls per Minute'
                }
              ]
            }
          }
        ],
        changeSources: [
          {
            name: 'Pager duty 101',
            identifier: 'Pager_duty_101',
            type: 'PagerDuty',
            enabled: true,
            spec: { connectorRef: 'account.pd', pagerDutyServiceId: 'P9DDPEV' },
            category: 'Alert'
          },
          {
            name: 'Harness CD Next Gen',
            identifier: 'harness_cd_next_gen',
            type: 'HarnessCDNextGen',
            enabled: true,
            spec: {},
            category: 'Deployment'
          }
        ]
      },
      dependencies: []
    }
  },
  metaData: null,
  correlationId: 'f3cdbd07-e92d-4162-854e-c6aac938d0c0'
}

export const newrelicURL = `/cv/api/monitored-service/service1_env1?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1`
export const notificationRules = `/cv/api/monitored-service/Service_101_QA/notification-rules?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1&pageNumber=0&pageSize=10`
export const parseSampleDataURL = `/cv/api/parse-sample-data?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1`

export const parseSampleDataResponse = {
  status: 'SUCCESS',
  data: [
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199200000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199260000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199320000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199380000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199440000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199500000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199560000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199620000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199680000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199740000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199800000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199860000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199920000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653199980000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200040000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200100000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200160000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200220000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200280000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200340000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200400000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200460000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200520000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200580000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200640000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200700000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200760000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200820000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200880000 },
    { txnName: 'g1', metricName: null, metricValue: 15.0, timestamp: 1653200940000 }
  ],
  metaData: null,
  correlationId: 'f2c2199e-8bf3-4aa8-a2c2-0a6a9eeaa4a2'
}

export const newRelicServiceResponse = {
  status: 'SUCCESS',
  data: {
    createdAt: 1650467864366,
    lastModifiedAt: 1650958959123,
    monitoredService: {
      orgIdentifier: 'CVNG',
      projectIdentifier: 'SRMQASignoff',
      identifier: 'newrelic',
      name: 'newrelic',
      type: 'Application',
      description: '',
      serviceRef: 'newrelic',
      environmentRef: 'prod',
      environmentRefList: ['prod'],
      tags: {},
      sources: {
        healthSources: [
          {
            name: 'newrelic',
            identifier: 'newrelic',
            type: 'NewRelic',
            spec: {
              connectorRef: 'org.newrelic',
              applicationName: 'My Application',
              applicationId: '107019083',
              feature: 'apm',
              metricPacks: [{ identifier: 'Performance' }],
              newRelicMetricDefinitions: [
                {
                  identifier: 'New_Relic_Metric',
                  metricName: 'New Relic Metric',
                  riskProfile: { category: 'Performance', metricType: 'APDEX', thresholdTypes: ['ACT_WHEN_HIGHER'] },
                  analysis: {
                    liveMonitoring: { enabled: true },
                    deploymentVerification: {
                      enabled: true,
                      serviceInstanceFieldName: null,
                      serviceInstanceMetricPath: null
                    },
                    riskProfile: { category: 'Performance', metricType: 'APDEX', thresholdTypes: ['ACT_WHEN_HIGHER'] }
                  },
                  sli: { enabled: true },
                  groupName: 'g1',
                  nrql: "SELECT count(apm.service.instance.count) FROM Metric WHERE appName LIKE 'My Application' TIMESERIES",
                  responseMapping: {
                    metricValueJsonPath: '$.timeSeries.[*].results.[*].count',
                    timestampJsonPath: '$.timeSeries.[*].beginTimeSeconds',
                    serviceInstanceJsonPath: null,
                    timestampFormat: null
                  }
                }
              ],
              metricDefinitions: [
                {
                  identifier: 'New_Relic_Metric',
                  metricName: 'New Relic Metric',
                  riskProfile: { category: 'Performance', metricType: 'APDEX', thresholdTypes: ['ACT_WHEN_HIGHER'] },
                  analysis: {
                    liveMonitoring: { enabled: true },
                    deploymentVerification: {
                      enabled: true,
                      serviceInstanceFieldName: null,
                      serviceInstanceMetricPath: null
                    },
                    riskProfile: { category: 'Performance', metricType: 'APDEX', thresholdTypes: ['ACT_WHEN_HIGHER'] }
                  },
                  sli: { enabled: true },
                  groupName: 'g1',
                  nrql: "SELECT count(apm.service.instance.count) FROM Metric WHERE appName LIKE 'My Application' TIMESERIES",
                  responseMapping: {
                    metricValueJsonPath: '$.timeSeries.[*].results.[*].count',
                    timestampJsonPath: '$.timeSeries.[*].beginTimeSeconds',
                    serviceInstanceJsonPath: null,
                    timestampFormat: null
                  }
                }
              ]
            }
          }
        ],
        changeSources: []
      },
      dependencies: [],
      notificationRuleRefs: [],
      templateIdentifier: null,
      templateVersionLabel: null
    }
  },
  metaData: null,
  correlationId: 'af75987e-8e87-408b-b921-8d2ec73af1a2'
}
