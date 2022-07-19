/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  // ButtonSize,
  ButtonVariation,
  Container,
  ExpandingSearchInput,
  FlexExpander,
  IconName,
  Layout,
  TableV2,
  Text
} from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Classes, Menu, Popover, PopoverInteractionKind, Position, Spinner } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import qs from 'qs'
import type { CellProps, Column, Renderer } from 'react-table'
import cx from 'classnames'
import { debounce } from 'lodash-es'
import ReactTimeago from 'react-timeago'

import routes from '@common/RouteDefinitions'
import RbacButton from '@rbac/components/Button/Button'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import { useStrings } from 'framework/strings'
import {
  CcmK8sConnectorResponse,
  ConnectorInfoDTO,
  PageCcmK8sConnectorResponse,
  useGetCCMK8SConnectorList
  // useGetTestConnectionResult
} from 'services/cd-ng'
import { useFetchCcmMetaDataQuery } from 'services/ce/services'
import { generateFilters } from '@ce/utils/anomaliesUtils'
import { GROUP_BY_CLUSTER_NAME } from '@ce/utils/perspectiveUtils'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { CloudProvider } from '@ce/types'
import { useFeature } from '@common/hooks/useFeatures'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'

import { useCloudVisibilityModal } from '../CloudVisibilityModal/CloudVisibilityModal'
import { useAutoStoppingModal } from '../AutoStoppingModal/AutoStoppingModal'

import css from './CloudIntegrationTabs.module.scss'

type CustomColumn = Column<CcmK8sConnectorResponse>[]
type CustomCell = Renderer<CellProps<CcmK8sConnectorResponse>>

const ConnectorNameCell: CustomCell = cell => {
  const name = cell.row.original?.k8sConnector?.connector?.name

  return (
    <Text
      icon="app-kubernetes"
      iconProps={{ size: 30, margin: { right: 'small' } }}
      font={{ variation: FontVariation.BODY2 }}
      className={css.nameCell}
      lineClamp={1}
    >
      {name}
    </Text>
  )
}

const ConnectorStatusCell: CustomCell = cell => {
  // const { getString } = useStrings()
  // const { accountId } = useParams<{ accountId: string }>()

  const data = cell.row.original
  const status = data.k8sConnector?.status
  const isStatusSuccess = data.k8sConnector?.status === 'SUCCESS'

  // const [lastTestedAt, setLastTestedAt] = useState<number>()

  // const { mutate: testConnection } = useGetTestConnectionResult({
  //   identifier: data.connector?.identifier || '',
  //   queryParams: {
  //     accountIdentifier: accountId
  //   }
  // })

  const iconProps: { icon: IconName; iconProps: { size: number; color: Color } } = useMemo(() => {
    if (isStatusSuccess) {
      return { icon: 'full-circle', iconProps: { size: 8, color: Color.GREEN_500 } }
    } else {
      return { icon: 'warning-sign', iconProps: { size: 12, color: Color.RED_500 } }
    }
  }, [isStatusSuccess])

  return (
    <div className={css.statusCell}>
      <Text
        {...iconProps}
        font={{ variation: FontVariation.BODY }}
        color={isStatusSuccess ? Color.GREY_800 : Color.RED_500}
      >
        <ReactTimeago date={status?.lastTestedAt || status?.testedAt || ''} />
      </Text>
      {/* {!isStatusSuccess ? (
        <Button
          variation={ButtonVariation.SECONDARY}
          size={ButtonSize.SMALL}
          text={getString('test')}
          className={css.testBtn}
          onClick={async e => {
            try {
              e.stopPropagation()
              await testConnection()
            } finally {
              setLastTestedAt(new Date().getTime())
            }
          }}
        />
      ) : null} */}
    </div>
  )
}

const FeaturesEnabledCell: CustomCell = cell => {
  const { getString } = useStrings()

  const featureInfo = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.CCM_K8S_CLUSTERS
    }
  })

  const k8sConnector = cell.row.original.k8sConnector?.connector as ConnectorInfoDTO
  const ccmk8sConnectorList = cell.row.original?.ccmk8sConnector

  const ccmk8sConnector = ccmk8sConnectorList?.[0]?.connector as ConnectorInfoDTO
  const permissions = (ccmk8sConnector?.spec?.featuresEnabled || []) as string[]

  const [openCloudVisibilityModal] = useCloudVisibilityModal({ connector: k8sConnector })
  const [openAutoStoppingModal] = useAutoStoppingModal({ connector: ccmk8sConnector })

  const isReportingEnabled = permissions.includes('VISIBILITY')
  const isAutoStoppingEnabled = permissions.includes('OPTIMIZATION')

  const ccmk8sConnectorStatus = ccmk8sConnectorList?.[0]?.status

  const props = useMemo(() => {
    if (ccmk8sConnectorStatus?.status === 'SUCCESS') {
      return {
        className: cx(css.permissionTag, css.success),
        background: Color.PURPLE_50,
        color: Color.PURPLE_700,
        icon: 'tick' as IconName,
        iconProps: { size: 12, color: Color.PURPLE_700 }
      }
    } else {
      return {
        className: cx(css.permissionTag, css.failure),
        background: Color.RED_50,
        color: Color.RED_800,
        icon: 'warning-sign' as IconName,
        iconProps: { size: 12, color: Color.RED_700 }
      }
    }
  }, [ccmk8sConnectorStatus])

  return (
    <Layout.Horizontal className={css.features}>
      {!ccmk8sConnectorList?.length ? (
        <Button
          icon="ccm-solid"
          variation={ButtonVariation.SECONDARY}
          text={getString('ce.cloudIntegration.enableCloudCosts')}
          onClick={e => {
            e.stopPropagation()
            openCloudVisibilityModal()
          }}
          disabled={!featureInfo.enabled}
        />
      ) : (
        <>
          {isReportingEnabled ? (
            <Popover
              disabled={ccmk8sConnectorStatus?.status !== 'FAILURE'}
              popoverClassName={Classes.DARK}
              position={Position.BOTTOM}
              interactionKind={PopoverInteractionKind.HOVER}
              content={
                <Text padding={'small'} color={Color.WHITE} font={{ variation: FontVariation.BODY }}>
                  {ccmk8sConnectorStatus?.errorSummary}
                </Text>
              }
            >
              <Text {...props}>{getString('ce.cloudIntegration.reporting')}</Text>
            </Popover>
          ) : null}
          {isAutoStoppingEnabled ? (
            <Text {...props}>{getString('common.ce.autostopping')}</Text>
          ) : (
            <Button
              icon="plus"
              variation={ButtonVariation.SECONDARY}
              className={css.addAutoStoppingBtn}
              text={getString('common.ce.autostopping')}
              onClick={e => {
                e.stopPropagation()
                openAutoStoppingModal()
              }}
            />
          )}
        </>
      )}
    </Layout.Horizontal>
  )
}

const MenuCell: CustomCell = () => {
  const { getString } = useStrings()

  // const data = cell.row.original.status

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Popover
      isOpen={menuOpen}
      className={Classes.DARK}
      interactionKind={'click'}
      onInteraction={nextOpenState => {
        setMenuOpen(nextOpenState)
      }}
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
        <Menu.Item text={getString('common.smtp.testConnection')} />
        {/* <Menu.Item icon="edit" text={getString('edit')} />
        <Menu.Item icon="trash" text={getString('delete')} /> */}
      </Menu>
    </Popover>
  )
}

const K8sClustersTab: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<{ accountId: string }>()

  const [k8sClusters, setK8sClusters] = useState<PageCcmK8sConnectorResponse>()
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const [ccmMetaResult] = useFetchCcmMetaDataQuery()
  const { data: ccmMetaDataRes, fetching: fetchingCCMMetaData } = ccmMetaResult

  const { loading, mutate: fetchConnectors } = useGetCCMK8SConnectorList({
    queryParams: {
      searchTerm,
      pageIndex: page,
      pageSize: 10,
      accountIdentifier: accountId
    }
  })

  const getK8sConnectors = async () => {
    const { data: connectorResponse } = await fetchConnectors({
      filterType: 'Connector',
      types: ['K8sCluster', 'CEK8sCluster']
    })

    setK8sClusters(connectorResponse)
  }

  useEffect(() => {
    getK8sConnectors()
  }, [page, searchTerm])

  const cloudProvider = 'CLUSTER' as CloudProvider
  const defaultClusterPerspectiveId = ccmMetaDataRes?.ccmMetaData?.defaultClusterPerspectiveId as string

  const ViewCostsCell: CustomCell = cell => {
    const ccmk8sConnectorList = cell.row.original.ccmk8sConnector
    const connector = ccmk8sConnectorList?.[0]?.connector

    const connectorName = connector?.name || ''
    const isReportingEnabled = connector?.spec?.featuresEnabled?.includes('VISIBILITY')

    const perspectiveLink = useMemo(
      () => ({
        pathname: routes.toPerspectiveDetails({
          accountId: accountId,
          perspectiveId: defaultClusterPerspectiveId,
          perspectiveName: defaultClusterPerspectiveId
        }),
        search: `?${qs.stringify({
          filters: JSON.stringify(generateFilters({ clusterName: connectorName }, cloudProvider)),
          groupBy: JSON.stringify(GROUP_BY_CLUSTER_NAME)
        })}`
      }),
      []
    )

    return isReportingEnabled ? (
      <Button
        variation={ButtonVariation.LINK}
        rightIcon="launch"
        iconProps={{ size: 12, color: Color.PRIMARY_7 }}
        text={getString('ce.cloudIntegration.viewCosts')}
        onClick={e => {
          e.stopPropagation()
          history.push(perspectiveLink)
        }}
      />
    ) : null
  }

  const columns = useMemo(
    () => [
      {
        accessor: 'name',
        Header: getString('connectors.name'),
        Cell: ConnectorNameCell,
        width: '25%'
      },
      {
        accessor: 'status',
        Header: getString('ce.cloudIntegration.connectorStatus'),
        Cell: ConnectorStatusCell,
        width: '30%'
      },
      {
        accessor: 'featuresEnabled',
        Header: getString('ce.cloudIntegration.featuresEnabled'),
        Cell: FeaturesEnabledCell,
        width: '40%'
      },
      {
        accessor: 'viewCosts',
        Header: '',
        Cell: ViewCostsCell,
        width: '15%'
      },
      {
        accessor: 'menu',
        Header: '',
        Cell: MenuCell,
        width: '5%'
      }
    ],
    [defaultClusterPerspectiveId]
  )

  const debouncedSearch = useCallback(
    debounce((text: string) => setSearchTerm(text), 500),
    []
  )

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: getK8sConnectors
  })

  const isLoading = loading || fetchingCCMMetaData

  return (
    <Container className={css.main}>
      <Layout.Horizontal margin={{ bottom: 'small' }}>
        <RbacButton
          variation={ButtonVariation.PRIMARY}
          text={getString('newConnector')}
          icon="plus"
          permission={{
            permission: PermissionIdentifier.UPDATE_CONNECTOR,
            resource: {
              resourceType: ResourceType.CONNECTOR
            }
          }}
          onClick={() => openConnectorModal(false, 'K8sCluster', undefined)}
          id="newConnectorBtn"
          data-test="newConnectorButton"
        />
        <FlexExpander />
        <ExpandingSearchInput
          placeholder={getString('search')}
          onChange={text => debouncedSearch(text)}
          className={css.search}
        />
      </Layout.Horizontal>
      {!isLoading ? (
        <TableV2<CcmK8sConnectorResponse>
          data={k8sClusters?.content || []}
          columns={columns as CustomColumn}
          className={css.table}
          onRowClick={({ k8sConnector }) =>
            history.push(routes.toConnectorDetails({ accountId, connectorId: k8sConnector?.connector?.identifier }))
          }
          pagination={{
            itemCount: k8sClusters?.totalItems || 0,
            pageSize: k8sClusters?.pageSize || 10,
            pageCount: k8sClusters?.totalPages || -1,
            pageIndex: k8sClusters?.pageIndex || 0,
            gotoPage: pageNo => setPage(pageNo)
          }}
        />
      ) : (
        <Container className={css.spinner}>
          <Spinner />
        </Container>
      )}
    </Container>
  )
}

export default K8sClustersTab

// const ReportingEnabledButton: React.FC = () => <Text></Text>

// const AutoStoppingEnabledButton: React.FC = () => <Text></Text>
