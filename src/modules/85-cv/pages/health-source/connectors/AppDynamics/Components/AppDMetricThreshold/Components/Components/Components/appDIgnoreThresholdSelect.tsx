import React from 'react'
import { Select } from '@harness/uicore'
import { getItembyValue } from './AppDIgnoreThresholdSelectUtils'
import type { SelectItem } from '../../../AppDMetricThreshold.types'
import css from '../../AppDMetricThresholdContent.module.scss'

export default function appDIgnoreThresholdSelect(
  name: string,
  items: SelectItem[],
  value: string,
  index: number,
  handleChange: (value: any) => void,
  error: string
): JSX.Element {
  return (
    <Select
      items={items}
      className={css.appDMetricThresholdContentSelect}
      name={name}
      value={getItembyValue(items, value)}
      onChange={item => handleChange(item.value)}
    ></Select>
  )
}
