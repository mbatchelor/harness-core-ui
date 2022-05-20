/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { Button, Layout } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { ParamsType, useServiceStore, Views } from '@cd/components/Services/common'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { NewEditServiceModal } from '@cd/components/PipelineSteps/DeployServiceStep/NewEditServiceModal'
import css from '@cd/components/Services/ServicesHeader/ServicesHeader.module.scss'

const useSetView = (fn: (arg: Views) => void, arg: Views): (() => void) => useCallback(() => fn(arg), [arg, fn])

export const ServicesHeader: React.FC = () => {
  const { orgIdentifier, projectIdentifier } = useParams<ParamsType>()
  const { getString } = useStrings()
  const { view, setView, fetchDeploymentList } = useServiceStore()

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideModal}
        title={getString('newService')}
        isCloseButtonShown
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <NewEditServiceModal
          data={{ name: '', identifier: '', orgIdentifier, projectIdentifier }}
          isEdit={false}
          isService
          onCreateOrUpdate={() => {
            ;(fetchDeploymentList.current as () => void)?.()
            hideModal()
          }}
          closeModal={hideModal}
        />
      </Dialog>
    ),
    [fetchDeploymentList, orgIdentifier, projectIdentifier]
  )

  return (
    <>
      <Layout.Horizontal className={css.header} flex={{ distribution: 'space-between' }}>
        <Layout.Horizontal>
          <RbacButton
            intent="primary"
            data-testid="add-service"
            icon="plus"
            iconProps={{ size: 10 }}
            text={getString('newService')}
            permission={{
              permission: PermissionIdentifier.EDIT_SERVICE,
              resource: {
                resourceType: ResourceType.SERVICE
              }
            }}
            onClick={showModal}
          />
        </Layout.Horizontal>
        <Layout.Horizontal flex>
          <Button
            minimal
            icon="insight-view"
            intent={view === Views.INSIGHT ? 'primary' : 'none'}
            onClick={useSetView(setView, Views.INSIGHT)}
          />
          <Button
            minimal
            icon="list-view"
            intent={view === Views.LIST ? 'primary' : 'none'}
            onClick={useSetView(setView, Views.LIST)}
          />
        </Layout.Horizontal>
      </Layout.Horizontal>
    </>
  )
}
