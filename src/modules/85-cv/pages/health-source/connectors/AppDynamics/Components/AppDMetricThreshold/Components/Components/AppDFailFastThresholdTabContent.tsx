import React, { useContext } from 'react'
import { Container, Text, FieldArray } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { AppDMetricThresholdContext } from '../../AppDMetricThreshold'
import appDThresholdSelect from './Components/appDThresholdSelect'
import type { SelectItem } from '../../AppDMetricThreshold.types'
import appDThresholdInput from './Components/appDThresholdInput'
import appDFailFastThresholdCriteria from './Components/appDFailFastThresholdCriteria'

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

function getActionItems(getString: UseStringsReturn['getString']): SelectItem[] {
  return [
    {
      label: getString('cv.monitoringSources.appD.failImmediately'),
      value: 'failImmediately'
    },
    {
      label: getString('cv.monitoringSources.appD.failAfterMulti'),
      value: 'failAfterMulti'
    }
  ]
}

export default function AppDFailFastThresholdTabContent(): JSX.Element {
  const { getString } = useStrings()

  const { formikValues } = useContext(AppDMetricThresholdContext)

  console.log('formikValues', formikValues.failFastThreshold)

  return (
    <Container margin={{ top: 'large' }}>
      <Text color={Color.BLACK}>{getString('cv.monitoringSources.appD.failFastThresholdHint')}</Text>

      <Container>
        <FieldArray
          label=""
          name="failFastThreshold"
          isDeleteOfRowAllowed={() => false}
          addLabel="Add Threshold"
          labelProps={{ style: { textTransform: 'uppercase' } }}
          fields={[
            {
              name: 'metricType',
              label: <Text>{getString('cv.monitoringSources.appD.metricType')}</Text>,
              // defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('metricType', getMetricTypeItems(getString), ...args)
            },
            {
              name: 'transaction',
              label: <Text>{getString('cv.monitoringSources.appD.groupTransaction')}</Text>,
              // defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('transaction', getTransactionItems(getString), ...args)
            },
            {
              name: 'metric',
              label: <Text>{getString('cv.monitoringSources.metricLabel')}</Text>,
              // defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('metric', getMetricItems(getString), ...args)
            },
            {
              name: 'action',
              label: <Text>{getString('action')}</Text>,
              // defaultValue: 'test1',
              renderer: (...args) => appDThresholdSelect('action', getActionItems(getString), ...args)
            },
            {
              name: 'count',
              label: <Text>{getString('action')}</Text>,
              // defaultValue: 'test1',
              renderer: (...args) => appDThresholdInput('count', getActionItems(getString), ...args)
            },
            {
              name: 'criteria',
              label: <Text>{getString('cf.segmentDetail.criteria')}</Text>,
              renderer: (value: string, rowIndex: number, onChange: (value: any) => void, error: string) => {
                const rowData = formikValues.failFastThreshold[rowIndex]
                return appDFailFastThresholdCriteria(rowData, rowIndex, getString, error)
              }
            }
          ]}
        />
      </Container>
    </Container>
  )
}
