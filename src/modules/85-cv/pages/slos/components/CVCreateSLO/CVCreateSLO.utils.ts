/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { omit, isEqual } from 'lodash-es'
import type { TabId } from '@blueprintjs/core'
import { SelectOption, Utils } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import { Color } from '@harness/design-system'
import type { UseStringsReturn, StringKeys } from 'framework/strings'
import type {
  ServiceLevelObjectiveDTO,
  ThresholdSLIMetricSpec,
  RatioSLIMetricSpec,
  CalenderSLOTargetSpec,
  MonthlyCalenderSpec,
  WeeklyCalendarSpec,
  RollingSLOTargetSpec,
  UserJourneyResponse,
  MonitoredServiceWithHealthSources,
  MetricDTO,
  ServiceLevelIndicatorDTO,
  MonitoredServiceDTO,
  NotificationRuleRefDTO
} from 'services/cv'
import { initialValuesSLO } from './CVCreateSLO.constants'
import {
  SLIForm,
  SLOForm,
  PeriodTypes,
  PeriodLengthTypes,
  Days,
  CreateSLOTabs,
  SLOFormFields,
  SLIMetricTypes,
  Comparators
} from './CVCreateSLO.types'

export const convertServiceLevelIndicatorToSLIFormData = (serviceLevelIndicator: ServiceLevelIndicatorDTO): SLIForm => {
  const { type: SLIType, name, identifier, healthSourceRef, sliMissingDataType, spec } = serviceLevelIndicator
  const { type: SLIMetricType, spec: SLIMetricSpec } = spec
  const { eventType, metric1, metric2, thresholdValue, thresholdType } = SLIMetricSpec as ThresholdSLIMetricSpec &
    RatioSLIMetricSpec

  return {
    name,
    identifier,
    healthSourceRef,
    SLIType,
    SLIMetricType,
    eventType,
    validRequestMetric: metric1,
    goodRequestMetric: metric2,
    objectiveValue: thresholdValue,
    objectiveComparator: thresholdType,
    SLIMissingDataType: sliMissingDataType
  }
}

export const getSLOInitialFormData = (
  serviceLevelObjective?: ServiceLevelObjectiveDTO,
  monitoredServiceIdentifier?: string
): SLOForm => {
  if (serviceLevelObjective) {
    const {
      serviceLevelIndicators: [serviceLevelIndicator],
      target,
      notificationRuleRefs,
      ...rest
    } = serviceLevelObjective
    const SLIMetricSpec = serviceLevelIndicator?.spec.spec as (ThresholdSLIMetricSpec & RatioSLIMetricSpec) | undefined
    const targetSpec = target.spec as (CalenderSLOTargetSpec & RollingSLOTargetSpec) | undefined
    const periodLengthTypeSpec = targetSpec?.spec as (MonthlyCalenderSpec & WeeklyCalendarSpec) | undefined

    return {
      ...omit(rest, ['orgIdentifier', 'projectIdentifier']),
      SLIType: serviceLevelIndicator?.type,
      SLIMetricType: serviceLevelIndicator?.spec.type,
      eventType: SLIMetricSpec?.eventType,
      validRequestMetric: SLIMetricSpec?.metric1 ?? '',
      goodRequestMetric: SLIMetricSpec?.metric2,
      objectiveValue: SLIMetricSpec?.thresholdValue,
      objectiveComparator: SLIMetricSpec?.thresholdType,
      SLIMissingDataType: serviceLevelIndicator?.sliMissingDataType,
      periodType: target.type,
      periodLength: targetSpec?.periodLength,
      periodLengthType: targetSpec?.type,
      dayOfWeek: periodLengthTypeSpec?.dayOfWeek,
      dayOfMonth: periodLengthTypeSpec?.dayOfMonth?.toString(),
      SLOTargetPercentage: target.sloTargetPercentage,
      notificationRuleRefs: notificationRuleRefs as NotificationRuleRefDTO[]
    }
  }

  return { ...initialValuesSLO, [SLOFormFields.MONITORED_SERVICE_REF]: monitoredServiceIdentifier || '' }
}

export const createSLORequestPayload = (
  values: SLOForm,
  orgIdentifier: string,
  projectIdentifier: string
): ServiceLevelObjectiveDTO => {
  return {
    name: values.name,
    identifier: values.identifier,
    description: values.description,
    tags: values.tags,
    userJourneyRef: values.userJourneyRef,
    monitoredServiceRef: values.monitoredServiceRef,
    healthSourceRef: values.healthSourceRef,
    orgIdentifier,
    projectIdentifier,
    notificationRuleRefs: values?.notificationRuleRefs,
    serviceLevelIndicators: [
      {
        type: values.SLIType,
        sliMissingDataType: values.SLIMissingDataType,
        spec: {
          type: values.SLIMetricType,
          spec: {
            eventType: values.SLIMetricType === SLIMetricTypes.RATIO ? values.eventType : undefined,
            metric1: values.validRequestMetric,
            metric2: values.SLIMetricType === SLIMetricTypes.RATIO ? values.goodRequestMetric : undefined,
            thresholdValue: values.objectiveValue,
            thresholdType: values.objectiveComparator
          } as ThresholdSLIMetricSpec | RatioSLIMetricSpec
        }
      }
    ],
    target: {
      type: values.periodType,
      sloTargetPercentage: values.SLOTargetPercentage,
      spec: {
        type: values.periodLengthType,
        periodLength: values.periodType === PeriodTypes.ROLLING ? values.periodLength : undefined,
        spec: {
          dayOfWeek: values.periodLengthType === PeriodLengthTypes.WEEKLY ? values.dayOfWeek : undefined,
          dayOfMonth: values.periodLengthType === PeriodLengthTypes.MONTHLY ? values.dayOfMonth : undefined
        } as MonthlyCalenderSpec | WeeklyCalendarSpec
      } as CalenderSLOTargetSpec | RollingSLOTargetSpec
    }
  }
}

export const isFormDataValid = (formikProps: FormikProps<SLOForm>, selectedTabId: CreateSLOTabs): boolean => {
  if (selectedTabId === CreateSLOTabs.NAME) {
    formikProps.setFieldTouched(SLOFormFields.NAME, true)
    formikProps.setFieldTouched(SLOFormFields.IDENTIFIER, true)
    formikProps.setFieldTouched(SLOFormFields.USER_JOURNEY_REF, true)
    formikProps.setFieldTouched(SLOFormFields.MONITORED_SERVICE_REF, true)

    const { name, identifier, userJourneyRef } = formikProps.values

    if (!name || !identifier || !userJourneyRef) {
      return false
    }
  }

  if (selectedTabId === CreateSLOTabs.SLI) {
    formikProps.setFieldTouched(SLOFormFields.HEALTH_SOURCE_REF, true)
    formikProps.setFieldTouched(SLOFormFields.EVENT_TYPE, true)
    formikProps.setFieldTouched(SLOFormFields.GOOD_REQUEST_METRIC, true)
    formikProps.setFieldTouched(SLOFormFields.VALID_REQUEST_METRIC, true)
    formikProps.setFieldTouched(SLOFormFields.OBJECTIVE_VALUE, true)
    formikProps.setFieldTouched(SLOFormFields.OBJECTIVE_COMPARATOR, true)
    formikProps.setFieldTouched(SLOFormFields.SLI_MISSING_DATA_TYPE, true)

    const {
      healthSourceRef,
      monitoredServiceRef,
      eventType,
      goodRequestMetric,
      validRequestMetric,
      objectiveValue,
      objectiveComparator,
      SLIMissingDataType
    } = formikProps.errors

    if (
      healthSourceRef ||
      monitoredServiceRef ||
      eventType ||
      goodRequestMetric ||
      validRequestMetric ||
      objectiveValue ||
      objectiveComparator ||
      SLIMissingDataType
    ) {
      return false
    }
  }

  return true
}

export const handleTabChange = (
  nextTabId: TabId,
  formik: FormikProps<SLOForm>,
  setSelectedTabId: (tabId: CreateSLOTabs) => void
): void => {
  switch (nextTabId) {
    case CreateSLOTabs.SLI: {
      isFormDataValid(formik, CreateSLOTabs.NAME) && setSelectedTabId(CreateSLOTabs.SLI)
      break
    }
    case CreateSLOTabs.SLO_TARGET_BUDGET_POLICY: {
      if (isFormDataValid(formik, CreateSLOTabs.NAME) && isFormDataValid(formik, CreateSLOTabs.SLI)) {
        setSelectedTabId(CreateSLOTabs.SLO_TARGET_BUDGET_POLICY)
      } else if (isFormDataValid(formik, CreateSLOTabs.NAME)) {
        setSelectedTabId(CreateSLOTabs.SLI)
      }
      break
    }
    default: {
      setSelectedTabId(CreateSLOTabs.NAME)
    }
  }
}

// SLO Name

export const getUserJourneyOptions = (userJourneyResponse?: UserJourneyResponse[]): SelectOption[] => {
  return (
    userJourneyResponse?.map(userJourney => ({
      label: userJourney.userJourney.name,
      value: userJourney.userJourney.identifier
    })) ?? []
  )
}

// SLI

export function getMonitoredServiceOptions(
  monitoredServiceWithHealthSources?: MonitoredServiceWithHealthSources[]
): SelectOption[] {
  return (
    monitoredServiceWithHealthSources?.map(monitoredService => ({
      label: monitoredService.name ?? '',
      value: monitoredService.identifier ?? ''
    })) ?? []
  )
}

export function getHealthSourceOptions(monitoredService?: MonitoredServiceDTO): SelectOption[] {
  return (
    monitoredService?.sources?.healthSources?.map(healthSource => ({
      label: healthSource?.name ?? '',
      value: healthSource?.identifier ?? ''
    })) ?? []
  )
}

// PickMetric

export const getSLOMetricOptions = (SLOMetricList?: MetricDTO[]): SelectOption[] => {
  return (
    SLOMetricList?.map(metric => ({
      label: metric.metricName ?? '',
      value: metric.identifier ?? ''
    })) ?? []
  )
}

export const getComparatorSuffixLabelId = (comparator?: ThresholdSLIMetricSpec['thresholdType']): StringKeys => {
  if (comparator === Comparators.LESS_EQUAL || comparator === Comparators.GREATER_EQUAL) {
    return 'cv.toObjectiveValue'
  }

  return 'cv.thanObjectiveValue'
}

// SLOTargetAndBudgetPolicy

export const getPeriodTypeOptions = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return [
    { label: getString('cv.slos.sloTargetAndBudget.periodTypeOptions.rolling'), value: PeriodTypes.ROLLING },
    { label: getString('cv.slos.sloTargetAndBudget.periodTypeOptions.calendar'), value: PeriodTypes.CALENDAR }
  ]
}

export const getPeriodLengthOptions = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return [
    {
      label: getString('triggers.schedulePanel.weeklyTabTitle'),
      value: PeriodLengthTypes.WEEKLY
    },
    {
      label: getString('common.monthly'),
      value: PeriodLengthTypes.MONTHLY
    },
    {
      label: getString('cv.quarterly'),
      value: PeriodLengthTypes.QUARTERLY
    }
  ]
}

export const getWindowEndOptionsForWeek = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return [
    { label: getString('cv.monday'), value: Days.MONDAY },
    { label: getString('cv.tuesday'), value: Days.TUESDAY },
    { label: getString('cv.wednesday'), value: Days.WEDNESDAY },
    { label: getString('cv.thursday'), value: Days.THURSDAY },
    { label: getString('cv.friday'), value: Days.FRIDAY },
    { label: getString('cv.saturday'), value: Days.SATURDAY },
    { label: getString('cv.sunday'), value: Days.SUNDAY }
  ]
}

export const getPeriodLengthOptionsForRolling = (): SelectOption[] => {
  return Array(31)
    .fill(0)
    .map((_, i) => ({ label: `${i + 1}`, value: `${i + 1}d` }))
}

export const getWindowEndOptionsForMonth = (): SelectOption[] => {
  return Array(31)
    .fill(0)
    .map((_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }))
}

export const getErrorBudget = (values: SLOForm): number => {
  const { periodType, periodLength = '', periodLengthType, SLOTargetPercentage } = values

  if (Number.isNaN(SLOTargetPercentage) || SLOTargetPercentage < 0 || SLOTargetPercentage > 100) {
    return 0
  }

  const minutesPerDay = 60 * 24
  let totalMinutes = 0

  if (periodType === PeriodTypes.ROLLING && Number.parseInt(periodLength)) {
    totalMinutes = Number.parseInt(periodLength) * minutesPerDay
  } else if (periodLengthType === PeriodLengthTypes.WEEKLY) {
    totalMinutes = 7 * minutesPerDay
  } else if (periodLengthType === PeriodLengthTypes.MONTHLY) {
    totalMinutes = 30 * minutesPerDay
  } else if (periodLengthType === PeriodLengthTypes.QUARTERLY) {
    totalMinutes = 90 * minutesPerDay
  }

  return Math.round(((100 - SLOTargetPercentage) / 100) * totalMinutes)
}

export const getCustomOptionsForSLOTargetChart = (values: SLOForm): Highcharts.Options => {
  const labelColor = Utils.getRealCSSColor(Color.PRIMARY_7)

  return {
    chart: { height: 200 },
    yAxis: {
      min: 0,
      max: 100,
      tickInterval: 25,
      plotLines: [
        {
          value: Number((Number(values.SLOTargetPercentage) || 0).toFixed(2)),
          color: Utils.getRealCSSColor(Color.PRIMARY_7),
          width: 2,
          zIndex: 4,
          label: {
            useHTML: true,
            formatter: function () {
              return `
                <div style="background-color:${labelColor};padding:4px 6px;border-radius:4px" >
                  <span style="color:white" >${Number((Number(values.SLOTargetPercentage) || 0).toFixed(2))}%</span>
                </div>
              `
            }
          }
        }
      ]
    }
  }
}

//

export const convertSLOFormDataToServiceLevelIndicatorDTO = (values: SLOForm): ServiceLevelIndicatorDTO => {
  return {
    name: values.name,
    identifier: values.identifier,
    type: values.SLIType,
    healthSourceRef: values.healthSourceRef,
    sliMissingDataType: values.SLIMissingDataType,
    spec: {
      type: values.SLIMetricType,
      spec: {
        eventType: values.SLIMetricType === SLIMetricTypes.RATIO ? values.eventType : undefined,
        metric2: values.SLIMetricType === SLIMetricTypes.RATIO ? values.goodRequestMetric : undefined,
        metric1: values.validRequestMetric,
        thresholdValue: values.objectiveValue,
        thresholdType: values.objectiveComparator
      } as ThresholdSLIMetricSpec & RatioSLIMetricSpec
    }
  }
}

const getVerifyData = (data: ServiceLevelObjectiveDTO): any => {
  const { monitoredServiceRef, healthSourceRef, serviceLevelIndicators, target } = data

  const { type: sliType, spec } = serviceLevelIndicators[0]

  return {
    monitoredServiceRef,
    healthSourceRef,
    sliType,
    specType: spec.type,
    metric1: spec.spec?.metric1,
    metric2: spec.spec?.metric2,
    eventType: spec.spec?.eventType,
    thresholdValue: spec.spec?.thresholdValue,
    thresholdType: spec.spec?.thresholdType,
    targetType: target.type,
    targetMonthly: target.spec?.type,
    dayOfMonth: target.spec.spec?.dayOfMonth,
    dayOfWeek: target.spec.spec?.dayOfWeek,
    sloTargetPercentage: target.sloTargetPercentage,
    periodLength: target.spec.periodLength
  }
}

export const getIsUserUpdatedSLOData = (
  existingData: ServiceLevelObjectiveDTO,
  formData: ServiceLevelObjectiveDTO
): boolean => {
  const existingDataToVerify = getVerifyData(existingData)
  const formDataToVerify = getVerifyData(formData)
  return isEqual(existingDataToVerify, formDataToVerify)
}
