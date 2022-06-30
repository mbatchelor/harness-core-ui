import React from 'react'
import cx from 'classnames'
import { Layout, FormInput } from '@harness/uicore'
import type { UseStringsReturn } from 'framework/strings'
import { getCriterialItems, getItembyValue } from './AppDThresholdSelectUtils'
import css from '../../AppDMetricThresholdContent.module.scss'

export default function appDIgnoreThresholdCriteria(
  rowData: any,
  rowIndex: number,
  getString: UseStringsReturn['getString'],
  error: string
): JSX.Element {
  return (
    <Layout.Horizontal style={{ alignItems: 'center' }}>
      <FormInput.Select
        items={getCriterialItems(getString)}
        className={cx(css.appDMetricThresholdContentSelect, css.appDMetricThresholdContentCriteria)}
        name={`ignoreThresholds.${rowIndex}.criteria.spec.type`}
        value={getItembyValue(getCriterialItems(getString), rowData?.criteria?.spec?.type)}
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
        className={css.appDMetricThresholdContentInput}
        label={getString('cv.monitoringSources.appD.lesserThan')}
        inputGroup={{ type: 'number' }}
        name={`ignoreThresholds.${rowIndex}.criteria.spec.lessThan`}
      />
    </Layout.Horizontal>
  )
}
