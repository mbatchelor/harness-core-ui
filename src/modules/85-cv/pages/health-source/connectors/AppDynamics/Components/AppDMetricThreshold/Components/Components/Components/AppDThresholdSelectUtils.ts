import type { UseStringsReturn } from 'framework/strings'
import type { SelectItem } from '../../../AppDMetricThreshold.types'
import { CriteriaValues, MetricTypeValues } from '../../../AppDMetricThresholdConstants'

export function getItembyValue(items: SelectItem[], value: string): SelectItem {
  return items.filter(x => x.value == value)[0]
}

export const getCriterialItems = (getString: UseStringsReturn['getString']): SelectItem[] => {
  return [
    {
      label: getString('cv.monitoringSources.appD.absoluteValue'),
      value: CriteriaValues.Absolute
    },
    {
      label: getString('cv.monitoringSources.appD.percentageDeviation'),
      value: CriteriaValues.Percentage
    }
  ]
}

export function getMetricTypeItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('performance'),
      value: MetricTypeValues.Performance
    },
    {
      label: getString('cv.monitoringSources.appD.customMetric'),
      value: MetricTypeValues.CustomMetric
    },
    {
      label: getString('error'),
      value: MetricTypeValues.Error
    }
  ]
}

export function getTransactionItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('cv.monitoringSources.appD.register'),
      value: 'register'
    },
    {
      label: getString('cv.monitoringSources.appD.verificationService'),
      value: 'verificationService'
    }
  ]
}

export function getMetricItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('cv.monitoringSources.appD.averageWaitTime'),
      value: 'averageWaitTime'
    },
    {
      label: getString('cv.monitoringSources.appD.callsPerMinute'),
      value: 'callsPerMinute'
    }
  ]
}

export function getActionItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('cv.monitoringSources.appD.failImmediately'),
      value: 'failImmediately'
    },
    {
      label: getString('cv.monitoringSources.appD.failAfterMulti'),
      value: 'failAfterMulti'
    }
  ]
}
