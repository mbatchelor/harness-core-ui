/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { Column } from 'react-table'
import { get } from 'lodash-es'
import { Container, Layout, Pagination, Text, TableV2, FontVariation, Color } from '@harness/uicore'
import { Intent } from '@harness/design-system'
import {
  EnvironmentResponseDTO,
  GetEnvironmentListForProjectQueryParams,
  useDeleteEnvironmentV2,
  useGetEnvironmentListForProject
} from 'services/cd-ng'
import { useToaster } from '@common/exports'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import { EnvironmentType } from '@common/constants/EnvironmentType'
import { useConfirmAction } from '@common/hooks/useConfirmAction'
import { useEnvStrings } from '@cf/hooks/environment'
import { String } from 'framework/strings'
import ListingPageTemplate from '@cf/components/ListingPageTemplate/ListingPageTemplate'
import EnvironmentDialog from '@cf/components/CreateEnvironmentDialog/EnvironmentDialog'
import routes from '@common/RouteDefinitions'
import { NoEnvironment } from '@cf/components/NoEnvironment/NoEnvironment'
import { withTableData } from '@cf/utils/table-utils'
import RbacOptionsMenuButton from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

type EnvData = { environment: EnvironmentResponseDTO }
const withEnvironment = withTableData<EnvironmentResponseDTO, EnvData>(({ row }) => ({ environment: row.original }))
const withActions = withTableData<
  EnvironmentResponseDTO,
  EnvData & { actions: { [P in 'onEdit' | 'onDelete']?: (id: string) => void } }
>(({ row, column }) => ({
  environment: row.original,
  actions: (column as any).actions as { [P in 'onEdit' | 'onDelete']?: (id: string) => void }
}))

export const TypeCell = withEnvironment(({ environment }) => {
  const { getString } = useEnvStrings()
  return <Text>{getString(environment.type === EnvironmentType.PRODUCTION ? 'production' : 'nonProduction')}</Text>
})

export const NameCell = withEnvironment(({ environment }) => {
  const { getString } = useEnvStrings()
  return (
    <Layout.Horizontal
      flex={{ distribution: 'space-between', align: 'center-center' }}
      padding={{ left: 'small', right: 'small' }}
    >
      <Layout.Vertical spacing="xsmall">
        <Text color={Color.BLACK} font={{ variation: FontVariation.BODY2 }}>
          {environment.name}
        </Text>

        {environment.description && (
          <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }}>
            {environment.description}
          </Text>
        )}

        <Container padding={{ top: 'xsmall' }} margin={{ bottom: 'xsmall' }}>
          <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }}>
            {getString('cf.environments.environmentID')} {environment.identifier}
          </Text>
        </Container>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
})

export const ModifiedByCell = withActions(({ environment, actions }) => {
  const { getString } = useEnvStrings()
  const identifier = environment.identifier as string
  const deleteEnvironment = useConfirmAction({
    title: getString('cf.environments.delete.title'),
    message: <String useRichText stringID="cf.environments.delete.message" vars={{ name: environment.name }} />,
    action: () => {
      actions.onDelete?.(identifier)
    },
    intent: Intent.DANGER,
    confirmText: getString('delete')
  })

  return (
    <Layout.Horizontal style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* TODO: Add user info when BE is ready */}
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

type CustomColumn<T extends Record<string, any>> = Column<T>

const EnvironmentsPage: React.FC = () => {
  const { getString } = useEnvStrings()
  const { showError, showSuccess } = useToaster()
  const history = useHistory()
  const [page, setPage] = useState(0)
  const { accountId: accountIdentifier, projectIdentifier, orgIdentifier } = useParams<Record<string, string>>()
  const queryParams = useMemo<GetEnvironmentListForProjectQueryParams>(() => {
    return {
      accountId: accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      size: CF_DEFAULT_PAGE_SIZE,
      page
    }
  }, [accountIdentifier, orgIdentifier, projectIdentifier, page])
  const {
    data: envData,
    loading,
    error,
    refetch
  } = useGetEnvironmentListForProject({
    queryParams
  })
  const { mutate: deleteEnvironment } = useDeleteEnvironmentV2({
    queryParams: {
      accountIdentifier,
      projectIdentifier,
      orgIdentifier
    }
  })
  const environments = envData?.data?.content
  const hasEnvs = Boolean(!loading && envData?.data?.content?.length)
  const emptyEnvs = Boolean(!loading && envData?.data?.content?.length === 0)

  const handleEdit = (id: string) => {
    history.push(
      routes.toCFEnvironmentDetails({
        environmentIdentifier: id,
        projectIdentifier,
        orgIdentifier,
        accountId: accountIdentifier
      })
    )
  }

  const handleDeleteEnv = async (id: string) => {
    try {
      await deleteEnvironment(id, { headers: { 'content-type': 'application/json' } })
      showSuccess(`Successfully deleted environment ${id}`)
      refetch()
    } catch (e) {
      showError(get(e, 'data.message', e?.message), 0, 'cf.delete.env.error')
    }
  }

  const columns: CustomColumn<EnvironmentResponseDTO>[] = useMemo(
    () => [
      {
        Header: getString('environment'),
        font: FontVariation.TABLE_HEADERS,
        id: 'name',
        width: '40%',
        accessor: 'name',
        Cell: NameCell
      },
      {
        Header: getString('typeLabel'),
        font: FontVariation.TABLE_HEADERS,
        id: 'type',
        accessor: 'type',
        width: '40%',
        Cell: TypeCell
      },
      {
        id: 'modifiedBy',
        font: FontVariation.TABLE_HEADERS,
        width: '20%',
        Cell: ModifiedByCell,
        actions: {
          onEdit: handleEdit,
          onDelete: handleDeleteEnv
        }
      }
    ],
    [getString, handleDeleteEnv]
  )

  return (
    <ListingPageTemplate
      title={getString('environments')}
      titleTooltipId="ff_env_heading"
      toolbar={
        hasEnvs && (
          <Layout.Horizontal>
            <EnvironmentDialog
              disabled={loading}
              environments={environments}
              onCreate={response => {
                setTimeout(() => {
                  history.push(
                    routes.toCFEnvironmentDetails({
                      environmentIdentifier: response?.data?.identifier as string,
                      projectIdentifier,
                      orgIdentifier,
                      accountId: accountIdentifier
                    })
                  )
                }, 1000)
              }}
            />
          </Layout.Horizontal>
        )
      }
      pagination={
        <Pagination
          itemCount={envData?.data?.totalItems || 0}
          pageSize={envData?.data?.pageSize || 0}
          pageCount={envData?.data?.totalPages || 0}
          pageIndex={page}
          gotoPage={index => {
            setPage(index)
            refetch({ queryParams: { ...queryParams, page: index } })
          }}
        />
      }
      error={error}
      retryOnError={refetch}
      loading={loading}
    >
      {hasEnvs && (
        <Container padding={{ top: 'medium', right: 'xlarge', left: 'xlarge' }}>
          <TableV2<EnvironmentResponseDTO>
            columns={columns}
            data={(environments as EnvironmentResponseDTO[]) || []}
            onRowClick={({ identifier }) => handleEdit(identifier as string)}
          />
        </Container>
      )}
      {emptyEnvs && (
        <Container flex={{ align: 'center-center' }} height="100%">
          <NoEnvironment
            onCreated={response =>
              setTimeout(() => {
                history.push(
                  routes.toCFEnvironmentDetails({
                    environmentIdentifier: response?.data?.identifier as string,
                    projectIdentifier,
                    orgIdentifier,
                    accountId: accountIdentifier
                  })
                )
              }, 1000)
            }
          />
        </Container>
      )}
    </ListingPageTemplate>
  )
}

export default EnvironmentsPage
