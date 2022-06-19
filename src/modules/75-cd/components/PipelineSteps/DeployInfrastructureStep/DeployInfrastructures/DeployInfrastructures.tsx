/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isNil } from 'lodash-es'
import type { FormikProps } from 'formik'
import cx from 'classnames'

import {
  ButtonSize,
  ButtonVariation,
  Dialog,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  SelectOption,
  useToaster
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import { InfrastructureResponse, InfrastructureResponseDTO, useGetInfrastructureList } from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import RbacButton from '@rbac/components/Button/Button'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import InfrastructureModal from '@cd/components/EnvironmentsV2/EnvironmentDetails/InfrastructureDefinition/InfrastructureModal'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { isEditInfrastructure } from '../utils'
import type { DeployInfrastructureStepConfig } from '../DeployInfrastructureStep'

import css from './DeployInfrastructures.module.scss'

interface DeployInfrastructuresProps {
  formikRef: React.MutableRefObject<FormikProps<DeployInfrastructureStepConfig> | null>
  readonly?: boolean
  allowableTypes: MultiTypeInputType[]
  initialValues: DeployInfrastructureStepConfig
}

export default function DeployInfrastructures({
  initialValues,
  formikRef,
  readonly,
  allowableTypes
}: DeployInfrastructuresProps) {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()

  const environmentIdentifier = useMemo(() => {
    return formikRef?.current?.values?.environment?.environmentRef
  }, [formikRef?.current?.values?.environment?.environmentRef])

  const {
    data: infrastructuresResponse,
    loading: infrastructuresLoading,
    error: infrastructuresError
  } = useGetInfrastructureList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    }
  })

  const [infrastructures, setInfrastructures] = useState<InfrastructureResponseDTO[]>()
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<string | undefined>()
  const [infrastructuresSelectOptions, setInfrastructuresSelectOptions] = useState<SelectOption[]>()
  const [infrastructureRefType, setInfrastructureRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(initialValues.infrastructureRef)
  )

  useEffect(() => {
    if (!infrastructuresLoading && !get(infrastructuresResponse, 'data.empty')) {
      setInfrastructures(
        defaultTo(
          get(infrastructuresResponse, 'data.content', [])?.map((infrastructureObj: InfrastructureResponse) => ({
            ...infrastructureObj.infrastructure
          })),
          []
        )
      )
    }
  }, [infrastructuresLoading, infrastructuresResponse])

  useEffect(() => {
    if (!isNil(infrastructures)) {
      setInfrastructuresSelectOptions(
        infrastructures.map(infrastructure => {
          return { label: defaultTo(infrastructure.name, ''), value: defaultTo(infrastructure.identifier, '') }
        })
      )
    }
  }, [infrastructures])

  useEffect(() => {
    if (
      !isEmpty(infrastructuresSelectOptions) &&
      !isNil(infrastructuresSelectOptions) &&
      initialValues.infrastructureRef
    ) {
      if (getMultiTypeFromValue(initialValues.infrastructureRef) === MultiTypeInputType.FIXED) {
        const existingInfrastructure = infrastructuresSelectOptions.find(
          infra => infra.value === initialValues.infrastructureRef
        )
        if (!existingInfrastructure) {
          if (!readonly) {
            formikRef.current?.setFieldValue('infrastructureRef', '')
          } else {
            const options = [...infrastructuresSelectOptions]
            options.push({
              label: initialValues.infrastructureRef,
              value: initialValues.infrastructureRef
            })
            setInfrastructuresSelectOptions(options)
          }
        } else {
          formikRef.current?.setFieldValue('infrastructureRef', existingInfrastructure.value)
          setSelectedInfrastructure(
            infrastructures?.filter(infra => infra.identifier === existingInfrastructure?.value)?.[0]?.yaml
          )
        }
      }
    }
  }, [infrastructuresSelectOptions])

  useEffect(() => {
    if (!isNil(infrastructuresError)) {
      showError(getRBACErrorMessage(infrastructuresError))
    }
  }, [infrastructuresError])

  const updateInfrastructuresList = (values: InfrastructureResponseDTO) => {
    const newInfrastructureList = [...defaultTo(infrastructures, [])]
    const existingIndex = newInfrastructureList.findIndex(item => item.identifier === values.identifier)
    if (existingIndex >= 0) {
      newInfrastructureList.splice(existingIndex, 1, values)
    } else {
      newInfrastructureList.unshift(values)
    }
    setInfrastructures(newInfrastructureList)
    setSelectedInfrastructure(newInfrastructureList[existingIndex >= 0 ? existingIndex : 0]?.yaml)
    formikRef.current?.setFieldValue('infrastructureRef', values.identifier)
    hideInfrastructuresModal()
  }

  const [showInfrastructuresModal, hideInfrastructuresModal] = useModalHook(
    () => (
      <Dialog
        isOpen
        isCloseButtonShown
        canEscapeKeyClose
        canOutsideClickClose
        enforceFocus={false}
        onClose={hideInfrastructuresModal}
        title={
          isEditInfrastructure(selectedInfrastructure)
            ? getString('cd.infrastructure.edit')
            : getString('cd.infrastructure.createNew')
        }
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <InfrastructureModal
          hideModal={hideInfrastructuresModal}
          refetch={updateInfrastructuresList}
          envIdentifier={environmentIdentifier}
          infrastructureToEdit={selectedInfrastructure}
          setInfrastructureToEdit={setSelectedInfrastructure}
        />
      </Dialog>
    ),
    [formikRef.current, selectedInfrastructure, setSelectedInfrastructure]
  )

  return (
    <Layout.Horizontal
      className={css.formRow}
      spacing="medium"
      flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
    >
      <FormInput.MultiTypeInput
        label={getString('cd.pipelineSteps.environmentTab.specifyYourInfrastructure')}
        tooltipProps={{ dataTooltipId: 'specifyYourInfrastructure' }}
        name="infrastructureRef"
        useValue
        disabled={readonly || (infrastructureRefType === MultiTypeInputType.FIXED && infrastructuresLoading)}
        placeholder={
          infrastructuresLoading
            ? getString('loading')
            : getString('cd.pipelineSteps.environmentTab.selectInfrastructure')
        }
        multiTypeInputProps={{
          onTypeChange: setInfrastructureRefType,
          width: 280,
          onChange: item => {
            setSelectedInfrastructure(
              infrastructures?.filter(infra => infra.identifier === (item as SelectOption)?.value)?.[0]?.yaml
            )
          },
          selectProps: {
            addClearBtn: !readonly,
            items: defaultTo(infrastructuresSelectOptions, [])
          },
          expressions,
          allowableTypes
        }}
        selectItems={defaultTo(infrastructuresSelectOptions, [])}
      />
      {infrastructureRefType === MultiTypeInputType.FIXED && (
        <RbacButton
          margin={{ top: 'xlarge' }}
          size={ButtonSize.SMALL}
          variation={ButtonVariation.LINK}
          disabled={readonly}
          onClick={showInfrastructuresModal}
          permission={{
            resource: {
              resourceType: ResourceType.ENVIRONMENT
            },
            permission: PermissionIdentifier.EDIT_ENVIRONMENT
          }}
          text={
            isEditInfrastructure(selectedInfrastructure)
              ? getString('common.editName', { name: getString('infrastructureText') })
              : getString('common.plusNewName', { name: getString('infrastructureText') })
          }
          id={isEditInfrastructure(selectedInfrastructure) ? 'edit-infrastructure' : 'add-new-infrastructure'}
        />
      )}
    </Layout.Horizontal>
  )
}
