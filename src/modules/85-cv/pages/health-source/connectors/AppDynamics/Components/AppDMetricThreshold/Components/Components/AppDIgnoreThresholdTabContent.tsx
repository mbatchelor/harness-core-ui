import React, { useContext } from 'react'
import { Container, Text, FieldArray } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { AppDMetricThresholdContext } from '../../AppDMetricThreshold'
import appDThresholdSelect from './Components/appDThresholdSelect'
import appDIgnoreThresholdCriteria from './Components/appDIgnoreThresholdCriteria'
import { getMetricItems, getMetricTypeItems, getTransactionItems } from './Components/AppDThresholdSelectUtils'

export default function AppDIgnoreThresholdTabContent(): JSX.Element {
  const { getString } = useStrings()

  const { formikValues } = useContext(AppDMetricThresholdContext)

  return (
    <Container margin={{ top: 'large' }}>
      <Text color={Color.BLACK}>{getString('cv.monitoringSources.appD.ignoreThresholdHint')}</Text>

      <Container>
        <FieldArray
          label=""
          name="ignoreThresholds"
          isDeleteOfRowAllowed={() => false}
          addLabel="Add Threshold"
          labelProps={{ style: { textTransform: 'uppercase' } }}
          fields={[
            {
              name: 'metricType',
              label: <Text>{getString('cv.monitoringSources.appD.metricType')}</Text>,
              defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('metricType', getMetricTypeItems(getString), ...args)
            },
            {
              name: 'transaction',
              label: <Text>{getString('cv.monitoringSources.appD.groupTransaction')}</Text>,
              defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('transaction', getTransactionItems(getString), ...args)
            },
            {
              name: 'metric',
              label: <Text>{getString('cv.monitoringSources.metricLabel')}</Text>,
              defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('metric', getMetricItems(getString), ...args)
            },
            {
              name: 'criteria',
              label: <Text>{getString('cf.segmentDetail.criteria')}</Text>,
              renderer: (value: string, rowIndex: number, onChange: (value: any) => void, error: string) => {
                const rowData = formikValues.ignoreThresholds[rowIndex]
                return appDIgnoreThresholdCriteria(rowData, rowIndex, getString, error)
              }
            }
          ]}
        />
      </Container>
    </Container>
  )
}
