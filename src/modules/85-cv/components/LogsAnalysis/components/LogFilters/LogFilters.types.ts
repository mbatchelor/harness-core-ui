import type { MultiSelectOption } from '@harness/uicore'
import type { EventTypeFullName } from '@cv/components/ExecutionVerification/components/LogAnalysisContainer/LogAnalysis.constants'
import type { ClusterTypes } from '@cv/components/ExecutionVerification/components/LogAnalysisContainer/LogAnalysisView.container.types'

export interface LogFiltersProps {
  clusterTypeFilters: ClusterTypes
  onFilterChange: (checked: boolean, itemName: EventTypeFullName) => void
  monitoredServiceIdentifier: string
  onHealthSouceChange: (selectedHealthSources: MultiSelectOption[]) => void
  selectedHealthSources: MultiSelectOption[]
}
