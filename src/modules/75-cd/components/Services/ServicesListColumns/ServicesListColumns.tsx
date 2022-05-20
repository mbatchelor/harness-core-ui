/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  Container,
  Layout,
  TagsPopover,
  Text,
  useConfirmationDialog,
  useToaster,
  Dialog
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, isEmpty, pick } from 'lodash-es'
import { Classes, Intent, Menu, Popover, Position } from '@blueprintjs/core'
import { useModalHook } from '@harness/use-modal'
import routes from '@common/RouteDefinitions'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useDeleteServiceV2 } from 'services/cd-ng'

import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { NewEditServiceModal } from '@cd/components/PipelineSteps/DeployServiceStep/NewEditServiceModal'
import { ServiceTabs } from '../utils/ServiceUtils'
import css from './ServicesListColumns.module.scss'

interface ServiceRow {
  row: { original: any }
}
interface ServiceItemProps {
  data: any
  onRefresh?: () => Promise<void>
}

export enum DeploymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed'
}

const ServiceMenu = (props: ServiceItemProps): React.ReactElement => {
  const { data: service, onRefresh } = props
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const { showSuccess, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const history = useHistory()
  const { NG_SVC_ENV_REDESIGN } = useFeatureFlags()

  const { mutate: deleteService } = useDeleteServiceV2({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier
    }
  })

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideModal}
        title={getString('editService')}
        isCloseButtonShown
        className={cx('padded-dialog', css.serviceDialogStyles)}
      >
        <Container>
          <NewEditServiceModal
            data={
              {
                ...pick(service, ['name', 'identifier', 'orgIdentifier', 'projectIdentifier', 'description', 'tags'])
              } || { name: '', identifier: '' }
            }
            isEdit={true}
            isService={false}
            onCreateOrUpdate={() => {
              hideModal()
              onRefresh && onRefresh()
            }}
            closeModal={hideModal}
          />
        </Container>
      </Dialog>
    ),
    [service, orgIdentifier, projectIdentifier]
  )

  const { openDialog: openDeleteErrorDialog } = useConfirmationDialog({
    titleText: getString('common.deleteServiceFailure'),
    contentText: deleteError,
    cancelButtonText: getString('close'),
    confirmButtonText: getString('common.viewReferences'),
    intent: Intent.DANGER,
    onCloseDialog: async isConfirmed => {
      setDeleteError('')
      if (isConfirmed) {
        history.push({
          pathname: routes.toServiceStudio({
            accountId,
            orgIdentifier,
            projectIdentifier,
            serviceId: service?.identifier,
            module
          }),
          search: `tab=${ServiceTabs.REFERENCED_BY}`
        })
      }
    }
  })

  const { openDialog } = useConfirmationDialog({
    titleText: getString('common.deleteService'),
    contentText: getString('common.deleteServiceConfirmation', { name: service?.name }),
    cancelButtonText: getString('cancel'),
    confirmButtonText: getString('confirm'),
    intent: Intent.DANGER,
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        try {
          const response = await deleteService(service?.identifier, {
            headers: { 'content-type': 'application/json' }
          })
          if (response.status === 'SUCCESS') {
            showSuccess(getString('common.deleteServiceMessage'))
            onRefresh && onRefresh()
          }
        } catch (err: any) {
          if (err?.data?.code === 'ENTITY_REFERENCE_EXCEPTION') {
            // showing reference by error in modal
            setDeleteError(err?.data?.message || err?.message)
            openDeleteErrorDialog()
          } else {
            showError(getRBACErrorMessage(err))
          }
        }
      }
    }
  })

  const handleEdit = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    if (NG_SVC_ENV_REDESIGN) {
      history.push({
        pathname: routes.toServiceStudio({
          accountId,
          orgIdentifier,
          projectIdentifier,
          serviceId: service?.identifier,
          module
        }),
        search: `tab=${ServiceTabs.Configuration}`
      })
    } else {
      showModal()
    }
  }

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    openDialog()
  }

  return (
    <Layout.Horizontal>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.RIGHT_TOP}
      >
        <Button
          minimal
          icon="Options"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu style={{ minWidth: 'unset' }}>
          <RbacMenuItem
            icon="edit"
            text={getString('edit')}
            onClick={handleEdit}
            permission={{
              resource: {
                resourceType: ResourceType.SERVICE,
                resourceIdentifier: defaultTo(service?.identifier, '')
              },
              permission: PermissionIdentifier.EDIT_SERVICE
            }}
          />
          <RbacMenuItem
            icon="trash"
            text={getString('delete')}
            onClick={handleDelete}
            permission={{
              resource: {
                resourceType: ResourceType.SERVICE,
                resourceIdentifier: defaultTo(service?.identifier, '')
              },
              permission: PermissionIdentifier.DELETE_SERVICE
            }}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const ServiceName = ({ row }: ServiceRow): React.ReactElement => {
  const service = row.original

  return (
    <div className={css.serviceName}>
      <Layout.Vertical>
        <Text color={Color.BLACK}>{service?.name}</Text>

        <Layout.Horizontal flex>
          <Text
            margin={{ top: 'xsmall', right: 'medium' }}
            color={Color.GREY_500}
            style={{
              fontSize: '12px',
              lineHeight: '24px',
              wordBreak: 'break-word'
            }}
          >
            Id: {service?.identifier}
          </Text>

          {!isEmpty(service?.tags) && (
            <div className={css.serviceTags}>
              <TagsPopover
                className={css.serviceTagsPopover}
                iconProps={{ size: 14, color: Color.GREY_600 }}
                tags={defaultTo(service?.tags, {})}
              />
            </div>
          )}
        </Layout.Horizontal>
      </Layout.Vertical>
    </div>
  )
}

const ServiceDescription = ({ row }: ServiceRow): React.ReactElement => {
  const service = row.original
  return (
    <Layout.Vertical className={css.serviceDescriptionWrapper}>
      <div className={css.serviceDescription}>
        <Text lineClamp={1}>{service?.description}</Text>
      </div>
    </Layout.Vertical>
  )
}

export { ServiceName, ServiceDescription, ServiceMenu }
