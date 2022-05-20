/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { CloudProvider } from '@ce/types'
import {
  getCPUValueInReadableForm,
  getMemValueInReadableForm,
  getMemValueInReadableFormForChart,
  getCPUValueInmCPUs,
  getMemValueInGB
} from '../formatResourceValue'

import { convertNumberToFixedDecimalPlaces } from '../convertNumberToFixedDecimalPlaces'

import formatCost from '../formatCost'
import { clusterInfoUtil, DEFAULT_GROUP_BY } from '../perspectiveUtils'
import { generateGroupBy, getCloudProviderFromFields, getFiltersFromEnityMap } from '../anomaliesUtils'
import { addBufferToValue, calculateNodes, isResourceConsistent } from '../recommendationUtils'

describe('test cases for recommendation utils', () => {
  test('test cases for CPU value formatter', () => {
    expect(getCPUValueInReadableForm(0.01)).toBe('10m')
    expect(getCPUValueInReadableForm(10)).toBe('10')
  })

  test('test cases for Memory value formatter', () => {
    expect(getMemValueInReadableForm(1000000000)).toBe('1000Mi')
    expect(getMemValueInReadableForm(100000000)).toBe('100Mi')
    expect(getMemValueInReadableForm(1000000)).toBe('1Mi')
    expect(getMemValueInReadableForm(4200000000)).toBe('4.2Gi')
  })

  test('test cases for converting number to fix decimal places', () => {
    expect(convertNumberToFixedDecimalPlaces('10.32324', 2)).toBe(10.32)
    expect(convertNumberToFixedDecimalPlaces(78.3232324, 2)).toBe(78.32)
  })

  test('test cases for getting mem value in GBs', () => {
    expect(getMemValueInGB(1000000000)).toBe('1Gi')
    expect(getMemValueInGB(100000000)).toBe('0.1Gi')
  })

  test('test cases for getting cpu values in mCPUs', () => {
    expect(getCPUValueInmCPUs(1)).toBe('1000')
    expect(getCPUValueInmCPUs(0.001)).toBe('1')
  })

  test('get mem in readable format for chart', () => {
    expect(getMemValueInReadableFormForChart(100000000)).toBe('100.00Mi')
    expect(getMemValueInReadableFormForChart(1000000)).toBe('1.00Mi')
  })

  test('add buffer to resource values', () => {
    expect(addBufferToValue(100, 100)).toBe(200)
    expect(addBufferToValue(0.1, 50)).toBe(0.15)
  })

  test('check if resource values are consistent', () => {
    expect(isResourceConsistent(1, 1, 2, 2, 0)).toBe(false)
    expect(isResourceConsistent(0, 0, 1, 2, 0)).toBe(false)
    expect(isResourceConsistent(2, 2, 1, 1, 0)).toBe(true)
  })

  test('test cases to calculate nodes', () => {
    expect(calculateNodes(10, 10, 20, 20, 6)).toMatchObject({ minimumNodes: 1, maximumNodes: 1 })
    expect(calculateNodes(32, 16, 4, 2, 7)).toMatchObject({ minimumNodes: 7, maximumNodes: 8 })
  })
})

describe('test cases for formatcost', () => {
  test('should be able to render cost correctly', () => {
    expect(formatCost(20)).toBe('$20.00')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(20, {
        shortFormat: true
      })
    ).toBe('$20.00')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(200, {
        shortFormat: true
      })
    ).toBe('$200.00')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(2000, {
        shortFormat: true
      })
    ).toBe('$2.00K')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(20000, {
        shortFormat: true
      })
    ).toBe('$20.0K')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(200000, {
        shortFormat: true
      })
    ).toBe('$200K')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(2241678, {
        shortFormat: true
      })
    ).toBe('$2.24M')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(22416781, {
        shortFormat: true
      })
    ).toBe('$22.4M')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(224167812, {
        shortFormat: true
      })
    ).toBe('$224M')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(2241678123, {
        shortFormat: true
      })
    ).toBe('$2.24B')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(22416781234, {
        shortFormat: true
      })
    ).toBe('$22.4B')
  })

  test('should be able to render cost correctly with short form', () => {
    expect(
      formatCost(224167812345, {
        shortFormat: true
      })
    ).toBe('$224B')
  })
})

describe('test cases for clusterInfoUtil', () => {
  test('should return values as expected', () => {
    expect(clusterInfoUtil()).toStrictEqual({ hasClusterAsSource: false, isClusterOnly: false })
    expect(clusterInfoUtil([])).toStrictEqual({ hasClusterAsSource: false, isClusterOnly: false })
    expect(clusterInfoUtil(['AWS'])).toStrictEqual({ hasClusterAsSource: false, isClusterOnly: false })
    expect(clusterInfoUtil(['CLUSTER'])).toStrictEqual({ hasClusterAsSource: true, isClusterOnly: true })
    expect(clusterInfoUtil(['AWS', 'CLUSTER'])).toStrictEqual({ hasClusterAsSource: true, isClusterOnly: false })
  })
})

describe('test cases for anomalyUtils', () => {
  const entityMap = {
    gcpProduct: 'Product',
    gcpProjectId: 'Project',
    gcpSKUDescription: 'SKUs',
    clusterName: 'Cluster Name',
    namespace: 'Namespace',
    workloadName: 'Workload',
    awsUsageAccountId: 'Account',
    awsServiceCode: 'Service',
    awsInstancetype: 'Instance Type',
    awsUsageType: 'Usage Type',
    workloadType: 'Workload Type',
    awsAccount: 'Account'
  }

  test('test cases for generateGroupBy utils', () => {
    expect(generateGroupBy('gcpProduct', CloudProvider.GCP)).toEqual({
      fieldId: 'gcpProduct',
      fieldName: 'Product',
      identifier: 'GCP',
      identifierName: 'GCP'
    })

    expect(generateGroupBy('', CloudProvider.GCP)).toEqual(DEFAULT_GROUP_BY)
  })

  test('test cases for getCloudProviderFromFields', () => {
    expect(getCloudProviderFromFields(entityMap)).toBe(CloudProvider.GCP)
    expect(getCloudProviderFromFields({ ...entityMap, gcpProjectId: null })).toBe(CloudProvider.AWS)
    expect(getCloudProviderFromFields({ ...entityMap, gcpProjectId: null, awsUsageAccountId: null })).toBe(
      CloudProvider.CLUSTER
    )
  })

  test('test cases for getFiltersFromEntityMap', () => {
    const entityMapArray = [
      {
        gcpProduct: 'Product',
        gcpProjectId: 'Project',
        gcpSKUDescription: 'SKUs',
        clusterName: 'Cluster Name',
        namespace: 'Namespace',
        workloadName: 'Workload',
        awsUsageAccountId: 'Account',
        awsServiceCode: 'Service',
        awsInstancetype: 'Instance Type',
        awsUsageType: 'Usage Type',
        workloadType: 'Workload Type',
        awsAccount: 'Account'
      },
      {
        gcpProduct: 'Product1',
        gcpProjectId: 'Project1',
        gcpSKUDescription: 'SKUs1',
        clusterName: 'Cluster Name1',
        namespace: 'Namespace1',
        workloadName: 'Workload1',
        awsUsageAccountId: 'Account1',
        awsServiceCode: 'Service1',
        awsInstancetype: 'Instance Type1',
        awsUsageType: 'Usage Type1',
        workloadType: 'Workload Type1',
        awsAccount: 'Account1'
      }
    ]

    expect(getFiltersFromEnityMap(entityMapArray, CloudProvider.GCP)).toEqual([
      {
        field: { fieldId: 'gcpProduct', fieldName: 'Product', identifier: 'GCP', identifierName: 'GCP' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['Product', 'Product1']
      },
      {
        field: { fieldId: 'gcpProjectId', fieldName: 'Project', identifier: 'GCP', identifierName: 'GCP' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['Project', 'Project1']
      },
      {
        field: { fieldId: 'gcpSKUDescription', fieldName: 'SKUs', identifier: 'GCP', identifierName: 'GCP' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['SKUs', 'SKUs1']
      }
    ])

    expect(getFiltersFromEnityMap(entityMapArray, CloudProvider.AWS)).toEqual([
      {
        field: { fieldId: 'awsUsageAccountId', fieldName: 'Account', identifier: 'AWS', identifierName: 'AWS' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['Account', 'Account1']
      },
      {
        field: { fieldId: 'awsServiceCode', fieldName: 'Service', identifier: 'AWS', identifierName: 'AWS' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['Service', 'Service1']
      },
      {
        field: { fieldId: 'awsInstancetype', fieldName: 'Instance Type', identifier: 'AWS', identifierName: 'AWS' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['Instance Type', 'Instance Type1']
      },
      {
        field: { fieldId: 'awsUsageType', fieldName: 'Usage Type', identifier: 'AWS', identifierName: 'AWS' },
        operator: 'IN',
        type: 'VIEW_ID_CONDITION',
        values: ['Usage Type', 'Usage Type1']
      }
    ])
  })
})
