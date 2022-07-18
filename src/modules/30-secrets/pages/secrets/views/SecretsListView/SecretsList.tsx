/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import ReactTimeago from 'react-timeago'
import { Menu, Position, Classes, Intent } from '@blueprintjs/core'
import type { Column, Renderer, CellProps } from 'react-table'
import {
  Text,
  Layout,
  Icon,
  Button,
  Popover,
  TagsPopover,
  useConfirmationDialog,
  useToaster,
  TableV2
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { String, useStrings } from 'framework/strings'
import { SecretResponseWrapper, useDeleteSecretV2 } from 'services/cd-ng'
import type { PageSecretResponseWrapper, SecretTextSpecDTO } from 'services/cd-ng'
import { getStringForType } from '@secrets/utils/SSHAuthUtils'
import useCreateSSHCredModal from '@secrets/modals/CreateSSHCredModal/useCreateSSHCredModal'
import useCreateUpdateSecretModal from '@secrets/modals/CreateSecretModal/useCreateUpdateSecretModal'
import { useVerifyModal } from '@secrets/modals/CreateSSHCredModal/useVerifyModal'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { SecretIdentifiers } from '@secrets/components/CreateUpdateSecret/CreateUpdateSecret'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import css from './SecretsList.module.scss'

interface SecretsListProps {
  secrets?: PageSecretResponseWrapper
  gotoPage: (pageNumber: number) => void
  refetch?: () => void
}

const RenderColumnSecret: Renderer<CellProps<SecretResponseWrapper>> = ({ row }) => {
  const data = row.original.secret
  const { getString } = useStrings()
  return (
    <Layout.Horizontal>
      {data.type === 'SecretText' || data.type === 'SecretFile' ? (
        <Icon name="key" size={28} margin={{ top: 'xsmall', right: 'small' }} />
      ) : null}
      {data.type === 'SSHKey' ? <Icon name="secret-ssh" size={28} margin={{ top: 'xsmall', right: 'small' }} /> : null}
      {data.type === 'WinRmCredentials' ? (
        <Icon name="command-winrm" size={28} margin={{ top: 'xsmall', right: 'small' }} />
      ) : null}
      <Layout.Vertical>
        <Layout.Horizontal spacing="small" width={230}>
          <Text color={Color.BLACK} lineClamp={1} className={css.secretName}>
            {data.name}
          </Text>
          {data.tags && Object.keys(data.tags).length ? <TagsPopover tags={data.tags} /> : null}
        </Layout.Horizontal>
        <Text color={Color.GREY_600} font={{ size: 'small' }} width={230} lineClamp={1}>
          {`${getString('common.ID')}: ${data.identifier}`}
        </Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

const RenderColumnDetails: Renderer<CellProps<SecretResponseWrapper>> = ({ row }) => {
  const data = row.original.secret
  return (
    <>
      {data.type === 'SecretText' || data.type === 'SecretFile' ? (
        <Text color={Color.BLACK} lineClamp={1} width={230}>
          {(data.spec as SecretTextSpecDTO).secretManagerIdentifier}
        </Text>
      ) : null}
      {/* TODO {Abhinav} display SM name */}
      <Text color={Color.GREY_600} font={{ size: 'small' }}>
        {getStringForType(data.type)}
      </Text>
    </>
  )
}

const RenderColumnActivity: Renderer<CellProps<SecretResponseWrapper>> = ({ row }) => {
  const data = row.original
  return data.updatedAt ? (
    <Layout.Horizontal spacing="small" color={Color.GREY_600}>
      <Icon name="activity" />
      <ReactTimeago date={data.updatedAt} />
    </Layout.Horizontal>
  ) : null
}

const RenderColumnStatus: Renderer<CellProps<SecretResponseWrapper>> = ({ row }) => {
  const data = row.original.secret
  const { openVerifyModal } = useVerifyModal()
  if (data.type === 'SecretText' || data.type === 'SecretFile') {
    return row.original.draft ? (
      <Text icon="warning-sign" intent="warning">
        {<String stringID="secrets.incompleteSecret" />}
      </Text>
    ) : null
  }
  if (data.type === 'SSHKey' || data.type === 'WinRmCredentials')
    return (
      <Button
        font="small"
        text={<String stringID="common.labelTestConnection" />}
        onClick={e => {
          e.stopPropagation()
          openVerifyModal(data)
          return
        }}
        withoutBoxShadow
      />
    )

  return null
}

const RenderColumnAction: Renderer<CellProps<SecretResponseWrapper>> = ({ row, column }) => {
  const data = row.original.secret
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { getRBACErrorMessage } = useRBACError()
  const { showSuccess, showError } = useToaster()
  const [menuOpen, setMenuOpen] = useState(false)
  const { mutate: deleteSecret } = useDeleteSecretV2({
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier },
    requestOptions: { headers: { 'content-type': 'application/json' } }
  })

  const { openCreateSSHCredModal } = useCreateSSHCredModal({ onSuccess: (column as any).refreshSecrets })
  const { openCreateSecretModal } = useCreateUpdateSecretModal({ onSuccess: (column as any).refreshSecrets })

  const permissionRequest = {
    resource: {
      resourceType: ResourceType.SECRET,
      resourceIdentifier: data.identifier
    }
  }

  const { openDialog } = useConfirmationDialog({
    contentText: <String stringID="secrets.confirmDelete" vars={{ name: data.name }} />,
    titleText: <String stringID="secrets.confirmDeleteTitle" />,
    confirmButtonText: <String stringID="delete" />,
    cancelButtonText: <String stringID="cancel" />,
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async didConfirm => {
      if (didConfirm && data.identifier) {
        try {
          await deleteSecret(data.identifier)
          showSuccess(`Secret ${data.name} deleted`)
          ;(column as any).refreshSecrets?.()
        } catch (err) {
          showError(getRBACErrorMessage(err))
        }
      }
    }
  })

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    openDialog()
  }

  const handleEdit = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    data.type === 'SSHKey'
      ? openCreateSSHCredModal(data)
      : openCreateSecretModal(data.type, {
          identifier: data.identifier,
          orgIdentifier: data.orgIdentifier,
          projectIdentifier: data.projectIdentifier
        } as SecretIdentifiers)
  }

  return (
    <Layout.Horizontal style={{ justifyContent: 'flex-end' }}>
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
        <Menu>
          <RbacMenuItem
            icon="edit"
            text="Edit"
            onClick={handleEdit}
            permission={{ ...permissionRequest, permission: PermissionIdentifier.UPDATE_SECRET }}
          />
          <RbacMenuItem
            icon="trash"
            text="Delete"
            onClick={handleDelete}
            permission={{ ...permissionRequest, permission: PermissionIdentifier.DELETE_SECRET }}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const SecretsList: React.FC<SecretsListProps> = ({ secrets, refetch, gotoPage }) => {
  const history = useHistory()
  const data: SecretResponseWrapper[] = useMemo(() => secrets?.content || [], [secrets?.content])
  const { pathname } = useLocation()
  const { getString } = useStrings()

  const columns: Column<SecretResponseWrapper>[] = useMemo(
    () => [
      {
        Header: getString('secretType'),
        accessor: row => row.secret.name,
        id: 'name',
        width: '30%',
        Cell: RenderColumnSecret
      },
      {
        Header: getString('details'),
        accessor: row => row.secret.description,
        id: 'details',
        width: '25%',
        Cell: RenderColumnDetails
      },
      {
        Header: getString('lastActivity'),
        accessor: 'updatedAt',
        id: 'activity',
        width: '20%',
        Cell: RenderColumnActivity
      },
      {
        Header: '',
        accessor: row => row.secret.type,
        id: 'status',
        width: '20%',
        Cell: RenderColumnStatus,
        refreshSecrets: refetch,
        disableSortBy: true
      },
      {
        Header: '',
        accessor: row => row.secret.identifier,
        id: 'action',
        width: '5%',
        Cell: RenderColumnAction,
        refreshSecrets: refetch,
        disableSortBy: true
      }
    ],
    [refetch]
  )

  return (
    <TableV2<SecretResponseWrapper>
      className={css.table}
      columns={columns}
      data={data}
      name="SecretsListView"
      onRowClick={secret => {
        history.push(`${pathname}/${secret.secret?.identifier}`)
      }}
      pagination={{
        itemCount: secrets?.totalItems || 0,
        pageSize: secrets?.pageSize || 10,
        pageCount: secrets?.totalPages || -1,
        pageIndex: secrets?.pageIndex || 0,
        gotoPage
      }}
    />
  )
}

export default SecretsList
