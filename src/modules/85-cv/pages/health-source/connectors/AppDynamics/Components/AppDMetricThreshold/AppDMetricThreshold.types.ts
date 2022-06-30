import type { AppDynamicsFomikFormInterface } from '../../AppDHealthSource.types'

export interface SelectItem {
  label: string
  value: string
}

export interface AppDMetricThresholdPropsType {
  formikValues: AppDynamicsFomikFormInterface
}

export type AppDMetricThresholdContextType = AppDMetricThresholdPropsType
