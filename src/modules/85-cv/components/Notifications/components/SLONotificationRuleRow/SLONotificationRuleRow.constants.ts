import type { SelectOption } from '@harness/uicore'

export enum SLOCondition {
  ERROR_BUDGET_REMAINING_PERCENTAGE = 'ErrorBudgetRemainingPercentage',
  ERROR_BUDGET_REMAINING_MINUTES = 'ErrorBudgetRemainingMinutes',
  ERROR_BUDGET_BURN_RATE_IS_ABOVE = 'ErrorBudgetBurnRate'
}

export const sloConditionOptions: SelectOption[] = [
  { label: 'Error Budget remaining percentage', value: SLOCondition.ERROR_BUDGET_REMAINING_PERCENTAGE },
  { label: 'Error Budget remaining minutes ', value: SLOCondition.ERROR_BUDGET_REMAINING_MINUTES },
  { label: 'Error Budget Burn Rate is above ', value: SLOCondition.ERROR_BUDGET_BURN_RATE_IS_ABOVE }
]
