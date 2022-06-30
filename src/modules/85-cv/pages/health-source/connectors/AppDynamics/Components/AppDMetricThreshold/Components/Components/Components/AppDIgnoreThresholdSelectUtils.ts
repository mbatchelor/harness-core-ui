import type { SelectItem } from '../../../AppDMetricThreshold.types'

export function getItembyValue(items: SelectItem[], value: string): SelectItem {
  return items.filter(x => x.value == value)[0]
}
