import type { SelectOption } from '@harness/uicore'

export enum Condition {
  CHANGE_IMPACT = 'ChangeImpact',
  HEALTH_SCORE = 'HealthScore',
  CHNAGE_OBSERVED = 'ChangeObserved'
}

export enum ChangeType {
  DEPLOYMENT = 'Deployment',
  INFRASTRUCTURE = 'Infrastructure',
  INCIDENT = 'Incident'
}

export const conditionOptions: SelectOption[] = [
  { label: 'Change Impact', value: Condition.CHANGE_IMPACT },
  { label: 'Health Score', value: Condition.HEALTH_SCORE },
  { label: 'Change Observed', value: Condition.CHNAGE_OBSERVED }
]

export const changeTypeOptions: SelectOption[] = [
  { label: 'Deployment', value: ChangeType.DEPLOYMENT },
  { label: 'Infrastructure', value: ChangeType.INFRASTRUCTURE },
  { label: 'Incident', value: ChangeType.INCIDENT }
]
