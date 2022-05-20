/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import produce from 'immer'
import * as Yup from 'yup'
import {
  Layout,
  Tag,
  Text,
  Formik,
  ButtonVariation,
  Button,
  ButtonSize,
  useToggleOpen,
  ConfirmationDialog
} from '@wings-software/uicore'
import { FontVariation, Intent } from '@harness/design-system'
import { set, debounce, cloneDeep, isEqual } from 'lodash-es'
import { FieldArray } from 'formik'
import { Tooltip } from '@blueprintjs/core'
import { String, useStrings } from 'framework/strings'
import type { UseStringsReturn } from 'framework/strings'
import { useGetBarriersSetupInfoList, StageDetail } from 'services/pipeline-ng'
import { useMutateAsGet } from '@common/hooks'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePipelineContext } from '../PipelineContext/PipelineContext'
import css from './FlowControl.module.scss'

const getErrors = (barriers: Barrier[], getString: UseStringsReturn['getString']): Barrier[] => {
  const errors: unknown[] = []
  const barrierValueMap: { [key: string]: { indexes: number[] } } = {}
  for (let index = 0; index < barriers.length; index++) {
    const barrierId = barriers[index].identifier
    if (barrierValueMap[barrierId]) {
      barrierValueMap[barrierId].indexes.push(index)
    } else {
      barrierValueMap[barrierId] = { indexes: barrierId === '' ? [index] : [] }
    }
  }
  Object.values(barrierValueMap).forEach(({ indexes }: { indexes: number[] }) => {
    indexes.forEach((errIndex: number) => {
      if (barriers[errIndex].identifier === '') {
        set(errors, `[${errIndex}].name`, getString('secrets.secret.validationIdentifier'))
      } else {
        set(errors, `[${errIndex}].name`, getString('common.duplicateId'))
      }
    })
  })
  return errors as Barrier[]
}

const getValidBarriers = (barriers: Barrier[]): Barrier[] =>
  barriers.filter(barrier => barrier.identifier.length > 0 && barrier.name.length > 0)

interface Barrier {
  identifier: string
  name: string
  id?: string
  mode?: 'ADD' | 'EDIT' | null
  stages?: StageDetail[]
}
export interface BarrierListProps {
  isReadonly: boolean
  list: Array<Barrier>
  createItem: (push: (data: Barrier) => void) => void
  deleteItem: (index: number, remove: (a: number) => void) => void
  commitItem: (data: Barrier, index: number) => void
  getString: UseStringsReturn['getString']
  loadingSetupInfo: boolean
}

export interface FlowControlRef {
  onRequestClose(): void
}

export function FlowControl(
  { onDiscard }: { onDiscard: () => void },
  ref: React.ForwardedRef<FlowControlRef>
): React.ReactElement {
  const {
    state: { pipeline, originalPipeline },
    isReadonly,
    updatePipeline
  } = usePipelineContext()

  const {
    isOpen: isConfirmationDialogOpen,
    open: openConfirmationDialog,
    close: closeConfirmationDialog
  } = useToggleOpen()

  const [barriers, updateBarriers] = React.useState<Barrier[]>(pipeline?.flowControl?.barriers || [])
  const { data, loading: loadingSetupInfo } = useMutateAsGet(useGetBarriersSetupInfoList, {
    body: yamlStringify({ pipeline: originalPipeline }) as unknown as void,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    },
    debounce: 800
  })

  React.useEffect(() => {
    if (data?.data) {
      const barrierInfoList = data?.data
      const newBarriers = cloneDeep(barriers)
      barrierInfoList.forEach(barrierInfo => {
        if (!barrierInfo.stages?.length) {
          return
        }
        const matchingIndex = newBarriers.findIndex(brr => brr.identifier === barrierInfo.identifier)
        if (matchingIndex > -1) {
          newBarriers[matchingIndex].stages = barrierInfo.stages
        }
      })
      updateBarriers(newBarriers)
    }
  }, [data?.data])

  const debouncedUpdatePipeline = React.useCallback(debounce(updatePipeline, 300), [updatePipeline])
  const addBarrier = (push: (data: Barrier) => void): void => {
    const newBarrier: Barrier = {
      name: '',
      identifier: '',
      id: uuid('', nameSpace()),
      mode: 'ADD'
    }
    const updatedState: Barrier[] = [...barriers, newBarrier]
    push(newBarrier)
    updateBarriers(updatedState)
  }

  const commitBarrier = (barrierData: Barrier, index: number): void => {
    if (!barrierData?.name?.length || !barrierData?.identifier?.length) {
      return
    }
    const updatedBarriers: Barrier[] = produce(barriers, draft => {
      draft[index] = {
        ...barrierData,
        mode: null
      }
    })
    updateBarriers(updatedBarriers)
  }

  const deleteBarrier = (index: number, remove: (index: number) => void): void => {
    if (barriers[index]?.stages?.length) return
    const updatedBarriers: Barrier[] = produce(barriers, draft => {
      draft.splice(index, 1)
    })
    updateBarriers(updatedBarriers)
    remove(index)
  }

  const submitBarrier = (): void => {
    const validBarriers = getValidBarriers(barriers)
    debouncedUpdatePipeline({
      ...pipeline,
      flowControl: {
        barriers: validBarriers.map(barrier => ({
          name: barrier.name,
          identifier: barrier.identifier
        }))
      }
    })
    onDiscard()
  }

  function onRequestClose(): void {
    if (!isEqual(pipeline?.flowControl?.barriers, barriers)) {
      openConfirmationDialog()
      return
    }
    onDiscard()
  }

  function handleConfirmation(confirm: boolean): void {
    if (confirm) {
      submitBarrier()
    }
    closeConfirmationDialog()
  }

  React.useImperativeHandle(ref, () => ({
    onRequestClose
  }))

  const { getString } = useStrings()

  React.useImperativeHandle(ref, () => ({
    onRequestClose
  }))

  return (
    <>
      <ConfirmationDialog
        titleText={getString('pipeline.barriers.flowControl')}
        contentText={getString('pipeline.stepConfigHasChanges')}
        isOpen={isConfirmationDialogOpen}
        confirmButtonText={getString('applyChanges')}
        cancelButtonText={getString('cancel')}
        onClose={handleConfirmation}
        intent={Intent.WARNING}
      />
      <div className={css.flowControlPanelHeader}>
        <div className={css.flowControlTitle}>
          <Layout.Horizontal>
            <Text
              lineClamp={1}
              width={300}
              font={{ variation: FontVariation.H4 }}
              tooltipProps={{ dataTooltipId: 'pipelineVariables' }}
            >
              {pipeline?.name}: {getString('pipeline.barriers.flowControl')}
            </Text>
          </Layout.Horizontal>
        </div>
        <div className={css.mainActions}>
          <Button
            disabled={isReadonly}
            variation={ButtonVariation.SECONDARY}
            size={ButtonSize.SMALL}
            text={getString('applyChanges')}
            onClick={submitBarrier}
          />
          <Button minimal size={ButtonSize.SMALL} text={getString('pipeline.discard')} onClick={onDiscard} />
        </div>
      </div>
      <div className={css.container}>
        <BarrierList
          isReadonly={isReadonly}
          list={barriers}
          createItem={addBarrier}
          deleteItem={deleteBarrier}
          commitItem={commitBarrier}
          getString={getString}
          loadingSetupInfo={loadingSetupInfo}
        />
      </div>
    </>
  )
}

export const FlowControlWithRef = React.forwardRef(FlowControl)

export function BarrierList({
  isReadonly,
  list,
  createItem,
  deleteItem,
  commitItem,
  getString,
  loadingSetupInfo
}: BarrierListProps): React.ReactElement {
  return (
    <Formik
      initialValues={{ barriers: list }}
      onSubmit={value => {
        console.log(value) //eslint-disable-line
      }}
      formName="flowControl"
      validate={({ barriers }: { barriers: Barrier[] }) => {
        const errors: any = { barriers: [] }
        const identifierErrors = getErrors(barriers, getString)
        if (identifierErrors.length) {
          errors.barriers = identifierErrors
        }
        return errors
      }}
      validationSchema={Yup.object().shape({
        barriers: Yup.array().of(
          Yup.object().shape({
            name: Yup.string().required(getString('pipeline.barriers.validation.barrierNamerequired')),
            identifier: Yup.string().min(1).required(getString('common.duplicateId'))
          })
        )
      })}
    >
      {formik => (
        <>
          <Layout.Vertical spacing="small">
            <Text font={{ variation: FontVariation.H5 }}>{getString('pipeline.barriers.syncBarriers')}</Text>
            <FieldArray
              name="barriers"
              render={({ push, remove }) => {
                return (
                  <div>
                    <div className={css.barrierList}>
                      {list.map((barrier: Barrier, index) =>
                        !barrier.mode ? (
                          <div className={css.rowItem} key={barrier.id}>
                            <div>
                              <Text lineClamp={1} className={css.rowHeader}>
                                {barrier.name}
                              </Text>
                              <Text lineClamp={1}>{barrier.identifier}</Text>
                            </div>
                            <div>
                              {barrier.stages?.map((stage: StageDetail) => (
                                <Tag className={cx(css.tag, css.spaceRight)} key={stage.name}>
                                  <Text lineClamp={1} width={50} className={css.tagText}>
                                    {stage.name}
                                  </Text>
                                </Tag>
                              ))}
                            </div>
                            <div className={css.barrierAction}>
                              <Tooltip
                                content={
                                  barrier.stages?.length
                                    ? 'Deleting this barrier is not allowed as it is being used in one or more stages'
                                    : ''
                                }
                              >
                                <RbacButton
                                  disabled={isReadonly}
                                  permission={{
                                    permission: PermissionIdentifier.EDIT_PIPELINE,
                                    resource: {
                                      resourceType: ResourceType.PIPELINE
                                    }
                                  }}
                                  icon="main-trash"
                                  variation={ButtonVariation.ICON}
                                  className={cx(css.deleteIcon, {
                                    [css.disabledIcon]: loadingSetupInfo || barrier.stages?.length
                                  })}
                                  withoutCurrentColor
                                  iconProps={{ size: 16, color: '#6B6D85' }}
                                  onClick={() => deleteItem(index, remove)}
                                />
                              </Tooltip>
                            </div>
                          </div>
                        ) : (
                          <div className={css.rowItem} key={barrier.id}>
                            <div className={css.newBarrier}>
                              {barrier.name} <br />
                              <NameId
                                nameLabel="Barrier Name"
                                identifierProps={{
                                  inputName: `barriers[${index}].name`,
                                  idName: `barriers[${index}].identifier`,
                                  inputGroupProps: {
                                    inputGroup: {
                                      onBlur: () =>
                                        !formik.errors?.barriers?.[index] &&
                                        commitItem(formik.values.barriers[index], index)
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div className={css.barrierAction}>
                              <RbacButton
                                permission={{
                                  permission: PermissionIdentifier.EDIT_PIPELINE,
                                  resource: {
                                    resourceType: ResourceType.PIPELINE
                                  }
                                }}
                                variation={ButtonVariation.ICON}
                                iconProps={{ color: '#6B6D85', size: 16 }}
                                icon="main-trash"
                                withoutCurrentColor
                                className={css.deleteIcon}
                                onClick={() => deleteItem(index, remove)}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <RbacButton
                      disabled={isReadonly}
                      permission={{
                        permission: PermissionIdentifier.EDIT_PIPELINE,
                        resource: {
                          resourceType: ResourceType.PIPELINE
                        }
                      }}
                      intent="primary"
                      variation={ButtonVariation.LINK}
                      icon="plus"
                      onClick={() => createItem(push)}
                      withoutCurrentColor
                      className={css.addbarrier}
                    >
                      <String stringID="pipeline.barriers.addBarrier" />
                    </RbacButton>
                  </div>
                )
              }}
            />
          </Layout.Vertical>
        </>
      )}
    </Formik>
  )
}
