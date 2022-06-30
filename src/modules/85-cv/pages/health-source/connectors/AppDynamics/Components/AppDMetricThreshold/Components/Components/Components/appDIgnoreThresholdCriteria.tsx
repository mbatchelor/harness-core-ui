import React from 'react'
import cx from 'classnames'
import { Layout, FormInput } from '@harness/uicore'
import type { UseStringsReturn } from 'framework/strings'
import { getItembyValue } from './AppDIgnoreThresholdSelectUtils'
import css from '../../AppDMetricThresholdContent.module.scss'

const criteriaItems = [
  {
    label: 'Absolute',
    value: 'absolute'
  },
  {
    label: 'Percentage',
    value: 'percentage'
  }
]

export default function appDIgnoreThresholdCriteria(
  rowData: any,
  rowIndex: number,
  getString: UseStringsReturn['getString'],
  error: string
): JSX.Element {
  return (
    <Layout.Horizontal style={{ alignItems: 'center' }}>
      <FormInput.Select
        items={criteriaItems}
        className={cx(css.appDMetricThresholdContentSelect, css.appDMetricThresholdContentCriteria)}
        name={`ignoreThresholds.${rowIndex}.criteria.spec.type`}
        value={getItembyValue(criteriaItems, rowData?.criteria?.spec?.type)}
      ></FormInput.Select>
      {rowData?.criteria?.spec?.type !== 'percentage' && (
        <FormInput.Text
          inline
          className={css.appDMetricThresholdContentInput}
          label={getString('cv.monitoringSources.appD.greaterThan')}
          inputGroup={{ type: 'number' }}
          name={`ignoreThresholds.${rowIndex}.criteria.spec.greaterThan`}
        />
      )}
      <FormInput.Text
        inline
        style={{ width: 150 }}
        className={css.appDMetricThresholdContentInput}
        label={getString('cv.monitoringSources.appD.lesserThan')}
        inputGroup={{ type: 'number' }}
        name={`ignoreThresholds.${rowIndex}.criteria.spec.lessThan`}
      />
    </Layout.Horizontal>
  )
}
