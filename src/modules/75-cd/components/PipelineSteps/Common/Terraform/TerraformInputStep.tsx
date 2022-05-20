/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { isEmpty } from 'lodash-es'

import {
  getMultiTypeFromValue,
  MultiTypeInputType,
  FormInput,
  FormikForm,
  Text,
  Container,
  Label
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import List from '@common/components/List/List'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { TerraformData, TerraformProps, TerraformStoreTypes } from './TerraformInterfaces'
import ConfigInputs from './InputSteps/ConfigSection'
import TFRemoteSection from './InputSteps/TFRemoteSection'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export default function TerraformInputStep<T extends TerraformData = TerraformData>(
  props: TerraformProps<T>
): React.ReactElement {
  const { getString } = useStrings()
  const { inputSetData, readonly, path, allowableTypes, onUpdate, onChange } = props
  const { expressions } = useVariablesExpression()
  /* istanbul ignore next */
  const onUpdateRef = (arg: TerraformData): void => {
    onUpdate?.(arg as T)
  }
  /* istanbul ignore next */
  const onChangeRef = (arg: TerraformData): void => {
    onChange?.(arg as T)
  }
  return (
    <FormikForm>
      {getMultiTypeFromValue((inputSetData?.template as TerraformData)?.spec?.provisionerIdentifier) ===
        MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.spec.provisionerIdentifier`}
            placeholder={getString('pipeline.terraformStep.provisionerIdentifier')}
            label={getString('pipelineSteps.provisionerIdentifier')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
            disabled={readonly}
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
          />
        </div>
      )}
      <ConfigInputs {...props} onUpdate={onUpdateRef} onChange={onChangeRef} />
      {inputSetData?.template?.spec?.configuration?.spec?.varFiles?.length && (
        <Label style={{ color: Color.GREY_900, paddingBottom: 'var(--spacing-medium)' }}>
          {getString('cd.terraformVarFiles')}
        </Label>
      )}
      {inputSetData?.template?.spec?.configuration?.spec?.varFiles?.map((varFile: any, index) => {
        if (varFile?.varFile?.type === TerraformStoreTypes.Inline) {
          return (
            <React.Fragment key={`${path}.spec.configuration.spec.varFiles[${index}]`}>
              <Container flex width={120} padding={{ bottom: 'small' }}>
                <Text font={{ weight: 'bold' }}>{getString('cd.varFile')}:</Text>
                {varFile?.varFile?.identifier}
              </Container>

              {getMultiTypeFromValue(varFile?.varFile?.spec?.content) === MultiTypeInputType.RUNTIME && (
                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormInput.MultiTextInput
                    name={`${path}.spec.configuration.spec.varFiles[${index}].varFile.spec.content`}
                    label={getString('pipelineSteps.content')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        } else if (varFile.varFile?.type === TerraformStoreTypes.Remote) {
          return (
            <TFRemoteSection
              remoteVar={varFile}
              index={index}
              {...props}
              onUpdate={onUpdateRef}
              onChange={onChangeRef}
            />
          )
        }
        return <></>
      })}

      {getMultiTypeFromValue(inputSetData?.template?.spec?.configuration?.spec?.backendConfig?.spec?.content) ===
        MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.TextArea
            name={`${path}.spec.configuration.spec.backendConfig.spec.content`}
            label={getString('cd.backEndConfig')}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.configuration?.spec?.targets as string) ===
        MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <List
            name={`${path}.spec.configuration.spec.targets`}
            label={<Text style={{ display: 'flex', alignItems: 'center' }}>{getString('pipeline.targets.title')}</Text>}
            disabled={readonly}
            style={{ marginBottom: 'var(--spacing-small)' }}
            expressions={expressions}
            isNameOfArrayType
          />
        </div>
      )}
    </FormikForm>
  )
}
