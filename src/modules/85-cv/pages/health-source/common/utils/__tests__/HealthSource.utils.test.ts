/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  convertMetricPackToMetricData,
  mapCommonMetricInfoToCommonMetricDefinition,
  mapCommonMetricDefinitionToCommonMetricInfo,
  validateAssignComponent,
  validateIdentifier,
  validateMetricPackData
} from '@cv/pages/health-source/common/utils/HealthSource.utils'
import { HealthSourceFieldNames } from '@cv/pages/health-source/common/utils/HealthSource.constants'
import {
  BaseHealthSourceMetricDefinitionMock,
  BaseHealthSourceMetricInfoMock
} from '@cv/pages/health-source/common/utils/__tests__/HealthSource.mock'

describe('Validate common HealthSource Utils', () => {
  test('should validate converting from metric pack to metric data', () => {
    expect(convertMetricPackToMetricData([{ identifier: 'Infrastructure' }, { identifier: 'Errors' }])).toEqual({
      Errors: true,
      Infrastructure: true
    })
    expect(convertMetricPackToMetricData()).toEqual({})
  })

  test('should return error when there is no metric pack', () => {
    const metricDataWithoutSelectedMetricPack = {}
    const expectedErrors: any = {}
    expectedErrors[HealthSourceFieldNames.METRIC_DATA] = 'cv.monitoringSources.appD.validations.selectMetricPack'
    expect(validateMetricPackData(metricDataWithoutSelectedMetricPack, val => val, {})).toEqual(expectedErrors)
  })
  test('should return no error when metric pack is provided', () => {
    const metricDataWithSelectedMetricPack = { Performance: true }
    const expectedErrors: any = {}
    expect(validateMetricPackData(metricDataWithSelectedMetricPack, val => val, {})).toEqual(expectedErrors)
  })

  test('should validate assign component', () => {
    const sliExpectedErrors: any = {}
    sliExpectedErrors[HealthSourceFieldNames.SLI] =
      'cv.monitoringSources.gco.mapMetricsToServicesPage.validation.baseline'
    // should return sli not selected error
    expect(validateAssignComponent(false, {}, val => val, {}, false)).toEqual(sliExpectedErrors)

    const baselineNotSelectedErrors: any = {}
    baselineNotSelectedErrors[HealthSourceFieldNames.LOWER_BASELINE_DEVIATION] =
      'cv.monitoringSources.prometheus.validation.deviation'
    baselineNotSelectedErrors[HealthSourceFieldNames.RISK_CATEGORY] =
      'cv.monitoringSources.gco.mapMetricsToServicesPage.validation.riskCategory'

    // should return error that no baseline is selected as well as error for risk category
    expect(validateAssignComponent(true, {}, val => val, { healthScore: true }, false)).toEqual(
      baselineNotSelectedErrors
    )

    const noErrors = {}
    // it should return NO ERRORS
    expect(validateAssignComponent(true, {}, val => val, {}, false)).toEqual(noErrors)
  })

  test('should validate metric identifiers', () => {
    const mockMappedMetricsWithDuplicates = new Map([
      ['metric_1', { identifier: 'identifier_2' }],
      ['metric_2', { identifier: 'identifier_2' }]
    ])
    const mockMetricWithIdentifier = { identifier: 'identifier_2' }
    const expectedErrorsWithDuplicatedIdentifiers: any = {}
    expectedErrorsWithDuplicatedIdentifiers[HealthSourceFieldNames.IDENTIFIER] =
      'cv.monitoringSources.prometheus.validation.metricIdentifierUnique'
    expect(
      validateIdentifier(
        mockMetricWithIdentifier,
        ['metric_1', 'metric_2'],
        1,
        {},
        val => val,
        mockMappedMetricsWithDuplicates
      )
    ).toEqual(expectedErrorsWithDuplicatedIdentifiers)

    const expectedErrorsWithoutDuplicatedIdentifiers = {}
    const mockMappedMetricsWithoutDuplicates = new Map([
      ['metric_1', { identifier: 'identifier_1' }],
      ['metric_2', { identifier: 'identifier_2' }]
    ])
    // with one metric, should not check for duplicates
    expect(
      validateIdentifier(
        { ...mockMetricWithIdentifier, identifier: undefined },
        ['metric_1'],
        1,
        {},
        val => val,
        mockMappedMetricsWithoutDuplicates
      )
    ).toEqual(expectedErrorsWithoutDuplicatedIdentifiers)

    expect(
      validateIdentifier(
        mockMetricWithIdentifier,
        ['metric_1', 'metric_2'],
        1,
        {},
        val => val,
        mockMappedMetricsWithoutDuplicates
      )
    ).toEqual(expectedErrorsWithoutDuplicatedIdentifiers)
  })

  test('should validate mapping from metric info to metric definition', () => {
    expect(mapCommonMetricInfoToCommonMetricDefinition(BaseHealthSourceMetricInfoMock)).toEqual(
      BaseHealthSourceMetricDefinitionMock
    )

    // with onlySLI selected and no risk category
    expect(
      mapCommonMetricInfoToCommonMetricDefinition({
        ...BaseHealthSourceMetricInfoMock,
        healthScore: false,
        riskCategory: undefined
      })
    ).toEqual({
      ...BaseHealthSourceMetricDefinitionMock,
      analysis: {
        ...BaseHealthSourceMetricDefinitionMock.analysis,
        liveMonitoring: {
          enabled: false
        },
        riskProfile: {}
      }
    })

    // with only ACT_WHEN_LOWER threshold type
    expect(
      mapCommonMetricInfoToCommonMetricDefinition({
        ...BaseHealthSourceMetricInfoMock,
        higherBaselineDeviation: false,
        lowerBaselineDeviation: true
      })
    ).toEqual({
      ...BaseHealthSourceMetricDefinitionMock,
      analysis: {
        ...BaseHealthSourceMetricDefinitionMock.analysis,
        riskProfile: {
          category: 'Performance',
          metricType: 'INFRA',
          thresholdTypes: ['ACT_WHEN_LOWER']
        }
      }
    })
    // with both thresholdTypes expected
    expect(
      mapCommonMetricInfoToCommonMetricDefinition({
        ...BaseHealthSourceMetricInfoMock,
        higherBaselineDeviation: true,
        lowerBaselineDeviation: true,
        healthScore: false,
        sli: false,
        continuousVerification: true
      })
    ).toEqual({
      ...BaseHealthSourceMetricDefinitionMock,
      sli: {
        enabled: false
      },
      analysis: {
        ...BaseHealthSourceMetricDefinitionMock.analysis,
        deploymentVerification: {
          enabled: true
        },
        liveMonitoring: {
          enabled: false
        },
        riskProfile: {
          category: 'Performance',
          metricType: 'INFRA',
          thresholdTypes: ['ACT_WHEN_LOWER', 'ACT_WHEN_HIGHER']
        }
      }
    })
  })

  test('should validate mapping from metric definition to metric info', () => {
    expect(mapCommonMetricDefinitionToCommonMetricInfo(BaseHealthSourceMetricDefinitionMock)).toEqual(
      BaseHealthSourceMetricInfoMock
    )

    // with thresholdTypes and without groupName
    expect(
      mapCommonMetricDefinitionToCommonMetricInfo({
        ...BaseHealthSourceMetricDefinitionMock,
        groupName: '',
        isManualQuery: true,
        sli: {
          enabled: false
        },
        analysis: {
          ...BaseHealthSourceMetricDefinitionMock.analysis,
          liveMonitoring: { enabled: false },
          deploymentVerification: {
            enabled: true
          },
          riskProfile: {
            category: undefined,
            metricType: undefined,
            thresholdTypes: ['ACT_WHEN_LOWER', 'ACT_WHEN_HIGHER']
          }
        }
      })
    ).toEqual({
      ...BaseHealthSourceMetricInfoMock,
      higherBaselineDeviation: true,
      lowerBaselineDeviation: true,
      groupName: undefined,
      riskCategory: '',
      sli: false,
      continuousVerification: true,
      healthScore: false,
      isManualQuery: true
    })
  })
})
