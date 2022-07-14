/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

const mappedServicesAndEnvs = new Map()

mappedServicesAndEnvs.set('SPLUNK Logs Query', {
  serviceInstance: '_sourcetype',
  metricName: 'SPLUNK Logs Query',
  query: 'error OR failed OR severe OR ( sourcetype=access_* ( 404 OR 500 OR 503 ) )'
})

export const params = {
  accountId: 'kmpySmUISimoRrJL6NL73w',
  orgIdentifier: 'default',
  projectIdentifier: 'Demo'
}

export const setupSource = {
  accountId: 'kmpySmUISimoRrJL6NL73w',
  orgIdentifier: 'default',
  projectIdentifier: 'Demo',
  name: 'Splunk dev 12',
  identifier: 'Splunk_dev',
  connectorRef: 'Splunk_Conn',
  isEdit: true,
  product: 'Splunk Cloud Logs',
  type: 'Splunk' as any,
  mappedServicesAndEnvs
}

export const splunkPayload = {
  type: 'Splunk',
  identifier: 'Splunk_dev',
  name: 'Splunk dev 12',
  spec: {
    connectorRef: 'Splunk_Conn',
    feature: 'Splunk Cloud Logs',
    queries: [
      {
        name: 'SPLUNK Logs Query',
        identifier: 'SPLUNK_Logs_Query',
        query: 'error OR failed OR severe OR ( sourcetype=access_* ( 404 OR 500 OR 503 ) )',
        serviceInstanceIdentifier: '_sourcetype'
      }
    ]
  }
}

export const data = {
  isEdit: true,
  healthSourceList: [
    {
      name: 'Splunk dev 12',
      identifier: 'Splunk_dev',
      type: 'Splunk',
      spec: {
        connectorRef: 'Splunk_Conn',
        feature: 'Splunk Cloud Logs',
        queries: [
          {
            name: 'SPLUNK Logs Query',
            query: 'error OR failed OR severe OR ( sourcetype=access_* ( 404 OR 500 OR 503 ) )',
            serviceInstanceIdentifier: '_sourcetype'
          }
        ]
      }
    }
  ],
  serviceRef: 'AppDService102',
  environmentRef: 'delete',
  monitoredServiceRef: {
    name: 'WithTagAndDescription 12',
    identifier: 'dadadadadsa',
    description: 'dasdasdas',
    tags: {
      tag1: '',
      tag2: ''
    }
  },
  healthSourceName: 'Splunk dev 12',
  healthSourceIdentifier: 'Splunk_dev',
  sourceType: 'Splunk',
  connectorRef: 'Splunk_Conn',
  product: {
    label: 'Splunk Cloud Logs',
    value: 'Splunk Cloud Logs'
  }
}

export const mockedSplunkSampleData = [
  {
    _time: '2021-08-11T00:00:00.000+00:00',
    pool: 'auto_generated_pool_enterprise',
    s: 'www1.zip:./www1/access.log',
    st: 'access_combined_wcookie',
    h: 'splunk-dev',
    idx: 'default',
    b: '4248458'
  },
  {
    _time: '2021-08-11T00:00:00.000+00:00',
    pool: 'auto_generated_pool_enterprise',
    s: 'www1.zip:./www1/secure.log',
    st: 'secure',
    h: 'splunk-dev',
    idx: 'default',
    b: '1160114'
  }
]
