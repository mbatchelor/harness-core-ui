import React from 'react'
import { TextInput } from '@harness/uicore'
import type { SelectItem } from '../../../AppDMetricThreshold.types'
import css from '../../AppDMetricThresholdContent.module.scss'

export default function appDThresholdInput(
  name: string,
  value: string,
  index: number,
  handleChange: (value: any) => void,
  error: string
): JSX.Element {
  return (
    <TextInput
      className={css.appDMetricThresholdContentInput}
      wrapperClassName={css.appDMetricThresholdContentInputWrapper}
      placeholder="NA"
      name={name}
      type="number"
      value={value}
      onChange={e => handleChange(Number((e.currentTarget as HTMLInputElement).value))}
    ></TextInput>
  )
}
