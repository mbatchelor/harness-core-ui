import React, { useContext } from 'react'
import { Container, Text, FieldArray } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { AppDMetricThresholdContext } from '../../AppDMetricThreshold'
import appDIgnoreThresholdSelect from './Components/appDIgnoreThresholdSelect'
import appDIgnoreThresholdCriteria from './Components/appDIgnoreThresholdCriteria'
import type { SelectItem } from '../../AppDMetricThreshold.types'

function getMetricTypeItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('performance'),
      value: 'performance'
    },
    {
      label: getString('cv.monitoringSources.appD.customMetric'),
      value: 'customMetric'
    }
  ]
}

function getTransactionItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('cv.monitoringSources.appD.register'),
      value: 'register'
    },
    {
      label: getString('cv.monitoringSources.appD.verificationService'),
      value: 'verificationService'
    }
  ]
}

function getMetricItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('cv.monitoringSources.appD.averageWaitTime'),
      value: 'averageWaitTime'
    },
    {
      label: getString('cv.monitoringSources.appD.callsPerMinute'),
      value: 'callsPerMinute'
    }
  ]
}

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
              renderer: (...args) => appDIgnoreThresholdSelect('metricType', getMetricTypeItems(getString), ...args)
            },
            {
              name: 'transaction',
              label: <Text>{getString('cv.monitoringSources.appD.groupTransaction')}</Text>,
              defaultValue: 'test1',
              renderer: (...args) => appDIgnoreThresholdSelect('transaction', getTransactionItems(getString), ...args)
            },
            {
              name: 'metric',
              label: <Text>{getString('cv.monitoringSources.metricLabel')}</Text>,
              defaultValue: 'test1',
              renderer: (...args) => appDIgnoreThresholdSelect('metric', getMetricItems(getString), ...args)
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
