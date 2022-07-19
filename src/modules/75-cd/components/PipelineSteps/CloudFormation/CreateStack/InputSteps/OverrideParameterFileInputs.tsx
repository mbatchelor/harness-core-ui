/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { map } from 'lodash-es'
import type { FormikContextType } from 'formik'
import { FormInput, Text, Container, Layout } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { CreateStackData, CreateStackProps } from '../../CloudFormationInterfaces.types'
import css from '../../CloudFormation.module.scss'

export default function OverrideParameterFileInputs<T extends CreateStackData = CreateStackData>(
  props: CreateStackProps<T> & { formik?: FormikContextType<any> }
): React.ReactElement {
  const { inputSetData, readonly, path, allowableTypes } = props

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  /* istanbul ignore next */
  const overrideParams = inputSetData?.template?.spec?.configuration?.parameterOverrides

  return (
    <>
      <Container flex width={250} padding={{ bottom: 'small' }}>
        <Text font={{ weight: 'bold' }}>{getString('cd.cloudFormation.overrideParameterFileDetails')}</Text>
      </Container>
      <Layout.Horizontal
        className={css.overridesInputHeader}
        flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
      >
        <Layout.Vertical className={css.overrideParam}>
          <Text style={{ color: 'rgb(11, 11, 13)' }}>{getString('name')}</Text>
        </Layout.Vertical>
        <Layout.Vertical>
          <Text style={{ color: 'rgb(11, 11, 13)' }}>{getString('valueLabel')}</Text>
        </Layout.Vertical>
      </Layout.Horizontal>
      {map(overrideParams, (_, i) => (
        <Layout.Horizontal key={`override-param-${i}`}>
          <FormInput.Text
            className={css.paddingRight}
            name={`${path}.spec.configuration.parameterOverrides[${i}].name`}
            label={''}
            disabled
          />
          <FormInput.MultiTextInput
            name={`${path}.spec.configuration.parameterOverrides[${i}].value`}
            label={''}
            multiTextInputProps={{ expressions, allowableTypes }}
            disabled={readonly}
          />
        </Layout.Horizontal>
      ))}
    </>
  )
}
