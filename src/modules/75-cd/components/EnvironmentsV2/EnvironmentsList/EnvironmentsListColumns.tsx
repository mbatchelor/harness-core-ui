/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import ReactTimeago from 'react-timeago'
import { defaultTo, isEmpty } from 'lodash-es'

import { Layout, TagsPopover, Text, Container, Checkbox } from '@harness/uicore'
import { Color } from '@harness/design-system'

import type { EnvironmentResponse } from 'services/cd-ng'
import { useStrings } from 'framework/strings'

import RbacOptionsMenuButton from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import { useConfirmAction } from '@common/hooks/useConfirmAction'
import { EnvironmentType } from '@common/constants/EnvironmentType'

import { withTableData } from '@cd/utils/tableUtils'

import css from './EnvironmentsList.module.scss'

interface EnvironmentRow {
  row: { original: any }
}

export enum DeploymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed'
}

const EnvironmentName = ({ row }: EnvironmentRow): React.ReactElement => {
  const { getString } = useStrings()
  const data = row.original

  const { environment: { name, tags, identifier } = {} } = data as EnvironmentResponse

  return (
    <Layout.Vertical>
      <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small" margin={{ bottom: 'small' }}>
        <Text color={Color.BLACK}>{name}</Text>
        {!isEmpty(tags) && (
          <TagsPopover
            className={css.tagsPopover}
            iconProps={{ size: 14, color: Color.GREY_600 }}
            tags={defaultTo(tags, {})}
          />
        )}
      </Layout.Horizontal>

      <Text color={Color.GREY_500} font={{ size: 'small' }} lineClamp={1}>
        {getString('common.ID')}: {identifier}
      </Text>
    </Layout.Vertical>
  )
}

type EnvData = { environment: EnvironmentResponse }
const withEnvironment = withTableData<EnvironmentResponse, EnvData>(({ row }) => ({
  environment: row.original.environment as EnvironmentResponse
}))
const withActions = withTableData<
  EnvironmentResponse,
  EnvData & { actions: { [P in 'onEdit' | 'onDelete']?: (id: string) => void } }
>(({ row, column }) => ({
  environment: row.original,
  actions: (column as any).actions as { [P in 'onEdit' | 'onDelete']?: (id: string) => void }
}))

export const EnvironmentTypes = withEnvironment(({ environment }) => {
  const { getString } = useStrings()
  return (
    <Text
      className={cx(css.environmentType, {
        [css.production]: (environment as any)?.type === EnvironmentType.PRODUCTION
      })}
      font={{ size: 'small' }}
    >
      {getString(
        (environment as any)?.type === EnvironmentType.PRODUCTION ? 'cd.serviceDashboard.prod' : 'cd.preProductionType'
      )}
    </Text>
  )
})

export const EnvironmentMenu = withActions(({ environment: environmentHOC, actions }) => {
  const { getString } = useStrings()
  const { environment } = environmentHOC
  const identifier = environment?.identifier as string
  const deleteEnvironment = useConfirmAction({
    title: getString('cd.environmentDelete'),
    message: (
      <span
        dangerouslySetInnerHTML={{ __html: getString('cd.environmentDeleteMessage', { name: environment?.name }) }}
      />
    ),
    action: () => {
      actions.onDelete?.(identifier)
    }
  })

  return (
    <Layout.Horizontal style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <Container
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
        }}
      >
        <RbacOptionsMenuButton
          items={[
            {
              icon: 'edit',
              text: getString('edit'),
              onClick: () => actions.onEdit?.(identifier),
              permission: {
                resource: { resourceType: ResourceType.ENVIRONMENT },
                permission: PermissionIdentifier.EDIT_ENVIRONMENT
              }
            },
            {
              icon: 'trash',
              text: getString('delete'),
              onClick: deleteEnvironment,
              permission: {
                resource: { resourceType: ResourceType.ENVIRONMENT },
                permission: PermissionIdentifier.DELETE_ENVIRONMENT
              }
            }
          ]}
        />
      </Container>
    </Layout.Horizontal>
  )
})

function DeleteCheckbox({ row, column }: any) {
  return (
    <Checkbox
      onClick={event => column.onCheckboxSelect(event, row?.original)}
      checked={column.environmentsToRemove.some(
        (selectedEnv: EnvironmentResponse) =>
          (selectedEnv as any).environment.identifier === row?.original?.environment.identifier
      )}
    />
  )
}

function LastUpdatedBy({ lastModifiedAt }: { lastModifiedAt?: number }): React.ReactElement {
  return (
    <Layout.Vertical spacing={'small'}>
      <ReactTimeago date={lastModifiedAt as number} />
    </Layout.Vertical>
  )
}

export { EnvironmentName, DeleteCheckbox, LastUpdatedBy }
