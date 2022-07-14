/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import {
  getMultiTypeFromValue,
  MultiTypeInputType,
  MultiTextInputProps,
  ExpressionInput,
  EXPRESSION_INPUT_PLACEHOLDER
} from '@harness/uicore'

import { connect, FormikContextType } from 'formik'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'

import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { MultiTypeFieldSelectorProps } from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'

import FileStoreSelectField from '@filestore/components/MultiTypeFileSelect/FileStoreSelect/FileStoreSelectField'
import FileSelectField from '@filestore/components/MultiTypeFileSelect/EncryptedSelect/EncryptedFileSelectField'
import { fileTypes } from './StartupScriptInterface.types'
import MultiTypeConfigFileSelect from './MultiTypeConfigFileSelect'

import css from './MultiConfigSelectField.module.scss'

export type MapValue = { id: string; key: string; value: string }[]
export type MultiTypeMapValue = MapValue | string

interface MultiTypeMapConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'> {
  variableName?: ConfigureOptionsProps['variableName']
}

export interface MultiTypeMapProps {
  name: string
  multiTypeFieldSelectorProps: Omit<MultiTypeFieldSelectorProps, 'name' | 'defaultValueToReset' | 'children'>
  valueMultiTextInputProps?: Omit<MultiTextInputProps, 'name'>
  enableConfigureOptions?: boolean
  configureOptionsProps?: MultiTypeMapConfigureOptionsProps
  formik?: FormikContextType<any>
  style?: React.CSSProperties
  cardStyle?: React.CSSProperties
  disabled?: boolean
  appearance?: 'default' | 'minimal'
  keyLabel?: string
  valueLabel?: string
  restrictToSingleEntry?: boolean
  fileType: string
  expressions: string[]
  values: string | string[]
}

export function MultiConfigSelectField(props: MultiTypeMapProps): React.ReactElement {
  const {
    name,
    multiTypeFieldSelectorProps,
    enableConfigureOptions = true,
    configureOptionsProps,
    formik,
    disabled,
    appearance,
    fileType,
    expressions
  } = props

  const getDefaultResetValue = () => {
    return ''
  }

  const value = get(formik?.values, name, getDefaultResetValue()) as MultiTypeMapValue

  const { getString } = useStrings()

  return (
    <div className={cx(css.group, appearance === 'minimal' ? css.minimalCard : '')}>
      <MultiTypeConfigFileSelect
        isFieldInput={true}
        name={name}
        defaultValueToReset={getDefaultResetValue()}
        hideError={true}
        style={{ flexGrow: 1, marginBottom: 0 }}
        allowedTypes={[MultiTypeInputType.RUNTIME, MultiTypeInputType.FIXED]}
        {...multiTypeFieldSelectorProps}
        disableTypeSelection={multiTypeFieldSelectorProps.disableTypeSelection || disabled}
        onTypeChange={e => {
          if (e !== MultiTypeInputType.RUNTIME) {
            formik?.setFieldValue(name, '')
          }
        }}
      >
        <div className={css.multiSelectField}>
          <div className={cx(css.group, css.withoutAligning)}>
            <MultiTypeConfigFileSelect
              name={name}
              label={''}
              defaultValueToReset={''}
              hideError={true}
              style={{ flexGrow: 1, marginBottom: 0, marginTop: 0 }}
              disableTypeSelection={false}
              supportListOfExpressions={true}
              defaultType={getMultiTypeFromValue(
                get(formik?.values, name),
                [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                true
              )}
              allowedTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
              expressionRender={() => {
                return (
                  <ExpressionInput
                    name={name}
                    value={get(formik?.values, name)}
                    disabled={false}
                    inputProps={{ placeholder: EXPRESSION_INPUT_PLACEHOLDER }}
                    items={expressions}
                    onChange={val =>
                      /* istanbul ignore next */
                      formik?.setFieldValue(name, val)
                    }
                  />
                )
              }}
            >
              <div className={css.fieldWrapper}>
                {fileType === fileTypes.ENCRYPTED ? (
                  <FileSelectField
                    value={get(formik?.values, name)}
                    name={name}
                    onChange={newValue => {
                      formik?.setFieldValue(name, newValue)
                    }}
                  />
                ) : (
                  <FileStoreSelectField
                    name={name}
                    onChange={newValue => {
                      formik?.setFieldValue(name, newValue)
                    }}
                  />
                )}
              </div>
            </MultiTypeConfigFileSelect>
          </div>
        </div>
      </MultiTypeConfigFileSelect>
      {enableConfigureOptions &&
        typeof value === 'string' &&
        getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 11 }}
            value={value}
            type={getString('map')}
            variableName={name}
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={val => formik?.setFieldValue(name, val)}
            {...configureOptionsProps}
            isReadonly={props.disabled}
          />
        )}
    </div>
  )
}

export default connect(MultiConfigSelectField)
