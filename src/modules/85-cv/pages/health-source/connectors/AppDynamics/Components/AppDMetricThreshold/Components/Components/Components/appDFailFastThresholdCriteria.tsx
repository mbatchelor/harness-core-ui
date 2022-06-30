import React from 'react'
import cx from 'classnames'
import { Layout, FormInput } from '@harness/uicore'
import type { UseStringsReturn } from 'framework/strings'
import { getItembyValue } from './AppDThresholdSelectUtils'
import type { SelectItem } from '../../../AppDMetricThreshold.types'
import css from '../../AppDMetricThresholdContent.module.scss'

const getCriterialItems = (getString: UseStringsReturn['getString']): SelectItem[] => {
  return [
    {
      label: getString('cv.monitoringSources.appD.absoluteValue'),
      value: 'absolute'
    },
    {
      label: getString('cv.monitoringSources.appD.percentageDeviation'),
      value: 'percentage'
    }
  ]
}

export default function appDFailFastThresholdCriteria(
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
        name={`failFastThreshold.${rowIndex}.criteria.spec.type`}
        value={getItembyValue(getCriterialItems(getString), rowData?.criteria?.spec?.type)}
      ></FormInput.Select>
      {rowData?.criteria?.spec?.type !== 'percentage' && (
        <FormInput.Text
          inline
          className={css.appDMetricThresholdContentInput}
          label={getString('cv.monitoringSources.appD.greaterThan')}
          inputGroup={{ type: 'number' }}
          name={`failFastThreshold.${rowIndex}.criteria.spec.greaterThan`}
        />
      )}
      <FormInput.Text
        inline
        style={{ width: 150 }}
        className={css.appDMetricThresholdContentInput}
        label={getString('cv.monitoringSources.appD.lesserThan')}
        inputGroup={{ type: 'number' }}
        name={`failFastThreshold.${rowIndex}.criteria.spec.lessThan`}
      />
    </Layout.Horizontal>
  )
}
