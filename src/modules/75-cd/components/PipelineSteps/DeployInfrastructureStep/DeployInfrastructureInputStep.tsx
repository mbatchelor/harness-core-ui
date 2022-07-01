/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { connect } from 'formik'

import { useStrings } from 'framework/strings'
import { CustomVariableInputSet } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableInputSet'

import type { DeployInfrastructureProps } from './utils'

import css from './DeployInfrastructureStep.module.scss'

function DeployInfrastructureInputStepInternal({
  inputSetData,
  initialValues,
  allowableTypes
}: DeployInfrastructureProps & { formik?: any }) {
  const { getString } = useStrings()

  return (
    <>
      {inputSetData?.template?.environment?.environmentInputs?.variables && (
        <>
          <Text font={{ size: 'normal', weight: 'bold' }} color={Color.BLACK} padding={{ bottom: 'medium' }}>
            {getString('environmentVariables')}
          </Text>
          <div className={css.sectionContent}>
            <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
              <CustomVariableInputSet
                allowableTypes={allowableTypes}
                // TODO: Change after type is created
                initialValues={initialValues.environment?.environmentInputs as any}
                template={inputSetData.template.environment.environmentInputs as any}
                path={`${inputSetData.path}.environmentInputs`}
                className={css.fullWidth}
              />
            </Layout.Horizontal>
          </div>
        </>
      )}

      {inputSetData?.template?.environment?.serviceOverrideInputs?.variables && (
        <>
          <Text font={{ size: 'normal', weight: 'bold' }} color={Color.BLACK} padding={{ bottom: 'medium' }}>
            {getString('common.serviceOverrides')}
          </Text>
          <div className={css.sectionContent}>
            <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
              <CustomVariableInputSet
                allowableTypes={allowableTypes}
                // TODO: Change after type is created
                initialValues={initialValues.environment?.serviceOverrideInputs as any}
                template={inputSetData.template.environment.serviceOverrideInputs as any}
                path={`${inputSetData.path}.serviceOverrideInputs`}
                className={css.fullWidth}
              />
            </Layout.Horizontal>
          </div>
        </>
      )}
    </>
  )
}
const DeployInfrastructureInputStep = connect(DeployInfrastructureInputStepInternal)

export default DeployInfrastructureInputStep
