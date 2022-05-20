/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import type { CellProps, Renderer } from 'react-table'
import { isEmpty as _isEmpty } from 'lodash-es'
import classNames from 'classnames'
import ReactTimeago from 'react-timeago'
import {
  Button,
  Container,
  ExpandingSearchInput,
  Icon,
  ButtonVariation,
  Layout,
  Radio,
  Text
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Table, TagsPopover } from '@common/components'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import { Connectors } from '@connectors/constants'
// import { ConnectorConnectivityDetails, ConnectorResponse, useGetTestConnectionResult } from 'services/cd-ng'
import type { ConnectorInfoDTO, ConnectorResponse } from 'services/cd-ng'
import { StringKeys, useStrings, String } from 'framework/strings'
// import { useParams } from 'react-router-dom'
// import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { ConnectorStatus } from '@ce/constants'
import { DelegateTypes } from '@connectors/pages/connectors/utils/ConnectorUtils'
import css from './COK8sClusterSelector.module.scss'

interface COK8sClusterSelectorProps {
  loading: boolean
  search: (t: string) => void
  clusters: ConnectorResponse[]
  selectedCluster: any
  onClusterAddSuccess: (connector: ConnectorResponse) => void
  refetchConnectors: () => Promise<void>
}

const TOTAL_ITEMS_PER_PAGE = 5

const RenderColumnConnector: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  const tags = data.connector?.tags || {}
  return (
    <Layout.Horizontal spacing="small">
      <div className={css.wrapper}>
        <Layout.Horizontal spacing="small">
          <div className={css.name} color={Color.BLACK} title={data.connector?.name}>
            {data.connector?.name}
          </div>
          {tags && Object.keys(tags).length ? <TagsPopover tags={tags} /> : null}
        </Layout.Horizontal>
        <div className={css.identifier} title={data.connector?.identifier}>
          {data.connector?.identifier}
        </div>
      </div>
    </Layout.Horizontal>
  )
}

const getConnectorDisplaySummaryLabel = (titleStringId: StringKeys, Element: JSX.Element): JSX.Element | string => {
  return (
    <div className={classNames(css.name, css.flex)}>
      {titleStringId ? (
        <Text inline color={Color.BLACK}>
          <String stringID={titleStringId} />:
        </Text>
      ) : null}
      {Element}
    </div>
  )
}

const displayDelegatesTagsSummary = (delegateSelectors: []): JSX.Element => {
  return (
    <div className={classNames(css.name)}>
      <Text inline color={Color.BLACK}>
        <String stringID={'delegate.delegateTags'} />:
      </Text>
      <Text inline margin={{ left: 'xsmall' }} color={Color.GREY_400}>
        {delegateSelectors?.join?.(', ')}
      </Text>
    </div>
  )
}

const getK8DisplaySummary = (connector: ConnectorInfoDTO): JSX.Element | string => {
  return connector?.spec?.credential?.type === DelegateTypes.DELEGATE_IN_CLUSTER
    ? displayDelegatesTagsSummary(connector.spec.delegateSelectors)
    : getConnectorDisplaySummaryLabel('UrlLabel', <Text>{connector?.spec?.credential?.spec?.masterUrl}</Text>)
}

const RenderColumnDetails: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original

  return data.connector ? (
    <div className={css.wrapper}>
      <div color={Color.BLACK}>{getK8DisplaySummary(data.connector)}</div>
    </div>
  ) : null
}

export const RenderColumnActivity: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      <Icon name="activity" />
      {data.activityDetails?.lastActivityTime ? <ReactTimeago date={data.activityDetails?.lastActivityTime} /> : null}
    </Layout.Horizontal>
  )
}
export const RenderColumnLastUpdated: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      {data.lastModifiedAt ? <ReactTimeago date={data.lastModifiedAt} /> : null}
    </Layout.Horizontal>
  )
}

const RenderColumnStatus: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  //   const { accountId } = useParams<AccountPathProps>()
  const [testing, setTesting] = useState(false)
  //   const [lastTestedAt, setLastTestedAt] = useState<number>()
  //   const [status, setStatus] = useState<ConnectorConnectivityDetails['status']>(data.status?.status)

  //   const [errorMessage, setErrorMessage] = useState<ErrorMessage>()
  const { getString } = useStrings()
  //   const { branch, repoIdentifier } = data.gitDetails || {}
  //   const [stepDetails, setStepDetails] = useState<StepDetails>({
  //     step: 1,
  //     intent: Intent.WARNING,
  //     status: 'PROCESS' // Replace when enum is added in uikit
  //   })

  //   const { mutate: reloadTestConnection } = useGetTestConnectionResult({
  //     identifier: data.connector?.identifier || '',
  //     queryParams: {
  //       accountIdentifier: accountId,
  //       branch,
  //       repoIdentifier
  //     },
  //     requestOptions: {
  //       headers: {
  //         'content-type': 'application/json'
  //       }
  //     }
  //   })

  //   const executeStepVerify = async (): Promise<void> => {
  //     if (stepDetails.step === StepIndex.get(STEP.TEST_CONNECTION)) {
  //       if (stepDetails.status === 'PROCESS') {
  //         try {
  //           const result = await reloadTestConnection()
  //           setStatus(result?.data?.status)
  //           setLastTestedAt(new Date().getTime())
  //           if (result?.data?.status === 'SUCCESS') {
  //             setStepDetails({
  //               step: 2,
  //               intent: Intent.SUCCESS,
  //               status: 'DONE'
  //             })
  //           } else {
  //             setErrorMessage({ ...result.data, useErrorHandler: false })
  //             setStepDetails({
  //               step: 1,
  //               intent: Intent.DANGER,
  //               status: 'ERROR'
  //             })
  //           }
  //           setTesting(false)
  //         } catch (err) {
  //           setLastTestedAt(new Date().getTime())
  //           setStatus('FAILURE')
  //           if (err?.data?.responseMessages) {
  //             setErrorMessage({
  //               errorSummary: err?.data?.message,
  //               errors: err?.data?.responseMessages || [],
  //               useErrorHandler: true
  //             })
  //           } else {
  //             setErrorMessage({ ...err.message, useErrorHandler: false })
  //           }
  //           setStepDetails({
  //             step: 1,
  //             intent: Intent.DANGER,
  //             status: 'ERROR'
  //           })
  //           setTesting(false)
  //         }
  //       }
  //     }
  //   }

  //   useEffect(() => {
  //     if (testing) executeStepVerify()
  //   }, [testing])

  const isStatusSuccess = status === ConnectorStatus.SUCCESS || data.status?.status === ConnectorStatus.SUCCESS

  return (
    <Layout.Horizontal>
      {!testing && (
        <Layout.Vertical width="100px">
          <Layout.Horizontal spacing="small">
            {data.status?.status ? (
              <Text
                inline
                icon={isStatusSuccess ? 'full-circle' : 'warning-sign'}
                iconProps={{
                  size: isStatusSuccess ? 6 : 12,
                  color: isStatusSuccess ? Color.GREEN_500 : Color.RED_500
                }}
              >
                {isStatusSuccess ? getString('active').toLowerCase() : getString('error').toLowerCase()}
              </Text>
            ) : null}
          </Layout.Horizontal>
          {/* {status || data.status?.status ? (
            <Text font={{ size: 'small' }} color={Color.GREY_400}>
              <ReactTimeago date={lastTestedAt || data.status?.testedAt || ''} />
            </Text>
          ) : null} */}
        </Layout.Vertical>
      )}
      {!testing && !isStatusSuccess && (
        <Button
          font="small"
          className={css.testBtn}
          text={getString('test').toUpperCase()}
          onClick={e => {
            e.stopPropagation()
            setTesting(true)
            // setStepDetails({
            //   step: 1,
            //   intent: Intent.WARNING,
            //   status: 'PROCESS' // Replace when enum is added in uikit
            // })
          }}
          withoutBoxShadow
        />
      )}
    </Layout.Horizontal>
  )
}

const COK8sClusterSelector: React.FC<COK8sClusterSelectorProps> = props => {
  const { getString } = useStrings()
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [selectedCluster, setSelectedCluster] = useState<any>(props.selectedCluster)

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: () => {
      props.refetchConnectors()
    }
  })

  const handleSearch = (text: string) => {
    pageIndex !== 0 && setPageIndex(0)
    props.search(text)
  }

  const TableCheck = (tableProps: CellProps<any>) => {
    return (
      <Radio
        className={css.radioSelector}
        checked={selectedCluster?.connector?.name === tableProps.row.original.connector.name}
        onClick={_ => setSelectedCluster(tableProps.row.original)}
      />
    )
  }

  const addConnector = () => {
    props.onClusterAddSuccess(selectedCluster)
  }

  const hasSelectedCluster = !_isEmpty(selectedCluster)
  return (
    <Container>
      <Layout.Vertical spacing={'medium'}>
        <Text font={{ variation: FontVariation.H3 }}>
          {getString('ce.co.autoStoppingRule.configuration.kubernetesModal.title')}
        </Text>
        <div className={css.sectionSeparator} />
        <Container>
          <Layout.Horizontal className={css.infoSection}>
            <Icon name={'info'} size={24} />
            <div>
              <Text>{getString('ce.co.autoStoppingRule.configuration.kubernetesModal.infoText1')}</Text>
              <Text>{getString('ce.co.autoStoppingRule.configuration.kubernetesModal.infoText2')}</Text>
            </div>
          </Layout.Horizontal>
          <Container className={css.ctaContainer}>
            <Button
              withoutBoxShadow
              className={css.borderBtn}
              onClick={() =>
                openConnectorModal(false, Connectors.CE_KUBERNETES, {
                  connectorInfo: {
                    orgIdentifier: '',
                    projectIdentifier: '',
                    spec: { featuresEnabled: ['VISIBILITY', 'OPTIMIZATION'] }
                  } as unknown as ConnectorInfoDTO
                })
              }
            >
              {getString('ce.co.autoStoppingRule.configuration.kubernetesModal.createNewConnectorBtn')}
            </Button>
          </Container>
        </Container>
        <div className={css.sectionSeparator} />
        <Container>
          <Layout.Horizontal className={css.searchAndFilterWrapper}>
            <ExpandingSearchInput className={css.searchContainer} onChange={handleSearch} alwaysExpanded />
          </Layout.Horizontal>
          {props.loading && (
            <Layout.Horizontal flex={{ justifyContent: 'center' }}>
              <Icon name="spinner" size={24} color="blue500" />
            </Layout.Horizontal>
          )}
          {!props.loading && (
            <Table<ConnectorResponse>
              data={(props.clusters || []).slice(
                pageIndex * TOTAL_ITEMS_PER_PAGE,
                pageIndex * TOTAL_ITEMS_PER_PAGE + TOTAL_ITEMS_PER_PAGE
              )}
              pagination={{
                pageSize: TOTAL_ITEMS_PER_PAGE,
                pageIndex: pageIndex,
                pageCount: Math.ceil((props.clusters || []).length / TOTAL_ITEMS_PER_PAGE),
                itemCount: (props.clusters || []).length,
                gotoPage: newPageIndex => setPageIndex(newPageIndex)
              }}
              columns={[
                { Header: '', id: 'selected', Cell: TableCheck, width: '5%' },
                {
                  Header: getString('connector').toUpperCase(),
                  accessor: row => row.connector?.name,
                  id: 'name',
                  width: '20%',
                  Cell: RenderColumnConnector
                },
                {
                  Header: getString('details').toUpperCase(),
                  accessor: row => row.connector?.description,
                  id: 'details',
                  width: '20%',
                  Cell: RenderColumnDetails
                },
                {
                  Header: getString('lastActivity').toUpperCase(),
                  accessor: 'activityDetails',
                  id: 'activity',
                  width: '20%',
                  Cell: RenderColumnActivity
                },
                {
                  Header: getString('connectivityStatus').toUpperCase(),
                  accessor: 'status',
                  id: 'status',
                  width: '15%',
                  Cell: RenderColumnStatus
                },
                {
                  Header: getString('lastUpdated').toUpperCase(),
                  accessor: 'lastModifiedAt',
                  id: 'lastModifiedAt',
                  width: '20%',
                  Cell: RenderColumnLastUpdated
                }
              ]}
            />
          )}
        </Container>
        <Layout.Horizontal style={{ paddingTop: 20 }}>
          <Layout.Horizontal spacing={'medium'} className={css.ctaContainer}>
            <Button
              onClick={addConnector}
              disabled={!hasSelectedCluster}
              // style={{
              //   backgroundColor: selectedCluster ? '#0278D5' : 'inherit',
              //   color: selectedCluster ? '#F3F3FA' : 'inherit'
              // }}
              variation={ButtonVariation.PRIMARY}
              withoutBoxShadow
            >
              {getString('ce.co.autoStoppingRule.configuration.addSelectedBtnText')}
            </Button>
          </Layout.Horizontal>
        </Layout.Horizontal>
      </Layout.Vertical>
    </Container>
  )
}

export default COK8sClusterSelector
