/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import type { CellProps } from 'react-table'
import cx from 'classnames'
import {
  Text,
  Layout,
  Container,
  Button,
  Icon,
  Link,
  Popover,
  HarnessDocTooltip,
  Heading,
  PageSpinner,
  Page,
  TableV2,
  ExpandingSearchInput,
  PageHeader,
  PillToggle
} from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { useHistory, useParams } from 'react-router-dom'
import { Classes, Drawer, Menu, Position } from '@blueprintjs/core'
import routes from '@common/RouteDefinitions'
import { useToaster } from '@common/exports'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import {
  AllResourcesOfAccountResponse,
  Service,
  ServiceSavings,
  useAllServiceResources,
  useGetServices,
  useHealthOfService,
  useRequestsOfService,
  useSavingsOfService,
  useGetServiceDiagnostics,
  ServiceError,
  useCumulativeServiceSavings,
  useDescribeServiceInContainerServiceCluster,
  useRouteDetails
} from 'services/lw'
import { String, useStrings } from 'framework/strings'
import useDeleteServiceHook from '@ce/common/useDeleteService'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useFeature } from '@common/hooks/useFeatures'
import RbacButton from '@rbac/components/Button/Button'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { FeatureDetail } from 'framework/featureStore/featureStoreUtil'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { RulesMode } from '@ce/constants'
import { Utils } from '@ce/common/Utils'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import COGatewayAnalytics from './COGatewayAnalytics'
import COGatewayCumulativeAnalytics from './COGatewayCumulativeAnalytics'
import ComputeType from './components/ComputeType'
import { getInstancesLink, getRelativeTime, getStateTag, getRiskGaugeChartOptions } from './Utils'
import useToggleRuleState from './useToggleRuleState'
import TextWithToolTip, { textWithToolTipStatus } from '../TextWithTooltip/TextWithToolTip'
import landingPageSVG from './images/AutostoppingRuleIllustration.svg'
import refreshIcon from './images/refresh.svg'
import NoDataImage from './images/NoData.svg'
import css from './COGatewayList.module.scss'

const textColor: { [key: string]: string } = {
  disable: '#6B6D85'
}

interface TableRowMenuProps {
  onStateToggle: (type: 'SUCCESS' | 'FAILURE', data: Service, index?: number) => void
  onDelete: (type: 'SUCCESS' | 'FAILURE', data: Service) => void
  onEdit: (data: Service) => void
}

interface SearchParams {
  isActive: boolean
  text: string
}

interface EmptyListPageProps {
  featureDetail?: FeatureDetail
}

function IconCell(tableProps: CellProps<Service>): JSX.Element {
  return <ComputeType data={tableProps.row.original} />
}
function TimeCell(tableProps: CellProps<Service>): JSX.Element {
  return (
    <Text lineClamp={3} color={tableProps.row.original.disabled ? textColor.disable : Color.GREY_500}>
      {tableProps.value} mins
    </Text>
  )
}
function NameCell(tableProps: CellProps<Service>): JSX.Element {
  return (
    <Text
      lineClamp={3}
      color={Color.BLACK}
      style={{ fontWeight: 600, color: tableProps.row.original.disabled ? textColor.disable : 'inherit' }}
    >
      {/* <Icon name={tableProps.row.original.provider.icon as IconName}></Icon> */}
      {tableProps.value}
    </Text>
  )
}

function SavingsCell(tableProps: CellProps<Service>): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const { data, loading: savingsLoading } = useSavingsOfService({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  return (
    <Layout.Horizontal spacing="large">
      <HighchartsReact
        highchart={Highcharts}
        options={
          !savingsLoading && data?.response != null
            ? getRiskGaugeChartOptions(
                (data?.response as ServiceSavings).savings_percentage as number,
                tableProps.row.original.disabled
              )
            : getRiskGaugeChartOptions(0)
        }
      />
      <Text className={css.savingsAmount}>
        {savingsLoading ? (
          <Icon name="spinner" size={12} color="blue500" />
        ) : !_isEmpty(data?.response) ? (
          `$${Math.round(((data?.response as ServiceSavings).actual_savings as number) * 100) / 100}`
        ) : (
          0
        )}
      </Text>
    </Layout.Horizontal>
  )
}

function ActivityCell(tableProps: CellProps<Service>): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const { data, loading: activityLoading } = useRequestsOfService({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  return (
    <>
      {activityLoading ? (
        <Icon name="spinner" size={12} color="blue500" />
      ) : !_isEmpty(data?.response) ? (
        <Layout.Horizontal spacing="medium">
          <Icon name="history" />
          <Text lineClamp={3} color={tableProps.row.original.disabled ? textColor.disable : Color.GREY_500}>
            {getRelativeTime(data?.response?.[0].created_at as string, 'YYYY-MM-DDTHH:mm:ssZ')}
          </Text>
        </Layout.Horizontal>
      ) : (
        '-'
      )}
    </>
  )
}
function ResourcesCell(tableProps: CellProps<Service>): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const isK8sRule = tableProps.row.original.kind === 'k8s'
  const { data, loading: healthLoading } = useHealthOfService({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { data: resources, loading: resourcesLoading } = useAllServiceResources({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number, // eslint-disable-line
    lazy: isK8sRule
  })

  const hasCustomDomains = (tableProps.row.original.custom_domains?.length as number) > 0
  const isSubmittedRule = tableProps.row.original.status === 'submitted'
  const isEcsRule = !_isEmpty(tableProps.row.original.routing?.container_svc)

  const { data: serviceDescribeData } = useDescribeServiceInContainerServiceCluster({
    account_id: accountId,
    cluster_name: _defaultTo(tableProps.row.original.routing?.container_svc?.cluster, ''),
    service_name: _defaultTo(tableProps.row.original.routing?.container_svc?.service, ''),
    lazy: !isEcsRule,
    queryParams: {
      accountIdentifier: accountId,
      cloud_account_id: tableProps.row.original.cloud_account_id,
      region: _defaultTo(tableProps.row.original.routing?.container_svc?.region, '')
    }
  })

  const getClickableLink = () => {
    return isK8sRule
      ? tableProps.row.original.routing?.k8s?.CustomDomain
      : hasCustomDomains
      ? tableProps.row.original.custom_domains?.[0]
      : tableProps.row.original.host_name
  }

  const handleDomainClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    if (isSubmittedRule) return
    const link = getClickableLink()
    window.open(`http://${link}`, '_blank')
  }

  const renderLink = (linkStr = '') => {
    return (
      <Layout.Horizontal spacing="small">
        <Text
          className={cx(css.link, {
            [css.disabled]: tableProps.row.original.disabled,
            [css.notAllowed]: isSubmittedRule
          })}
          onClick={handleDomainClick}
        >
          {linkStr}
        </Text>
      </Layout.Horizontal>
    )
  }

  return (
    <Container className={css.resourceCell}>
      <Layout.Vertical spacing="medium">
        <Layout.Horizontal spacing="xxxsmall">
          {!isK8sRule && !isEcsRule && (
            <>
              <Text
                style={{
                  alignSelf: 'center',
                  color: tableProps.row.original.disabled ? textColor.disable : 'inherit',
                  marginRight: 5
                }}
              >
                {getString('ce.co.noOfInstances')}
              </Text>
              {!resourcesLoading && resources?.response ? (
                <Link
                  href={getInstancesLink(tableProps.row.original, resources as AllResourcesOfAccountResponse)}
                  target="_blank"
                  style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: tableProps.row.original.disabled ? textColor.disable : 'inherit',
                    marginRight: 5
                  }}
                  onClick={e => {
                    e.stopPropagation()
                  }}
                >
                  {resources?.response?.length}
                </Link>
              ) : (
                <Icon name="spinner" size={12} color="blue500" style={{ marginRight: 5 }} />
              )}
            </>
          )}
          {!tableProps.row.original.disabled && !isEcsRule && (
            <>
              {data?.response?.['state'] != null ? (
                getStateTag(data?.response?.['state'])
              ) : !healthLoading ? (
                getStateTag('down')
              ) : (
                <Icon name="spinner" size={12} color="blue500" />
              )}
            </>
          )}
          {isEcsRule && (
            <>
              <Text
                style={{
                  alignSelf: 'center',
                  color: tableProps.row.original.disabled ? textColor.disable : 'inherit',
                  marginRight: 5
                }}
              >
                {`${getString('ce.co.noOfTasks')} ${_defaultTo(serviceDescribeData?.response?.task_count, 0)}`}
              </Text>
              {getStateTag(serviceDescribeData?.response?.task_count ? 'active' : 'down')}
            </>
          )}
        </Layout.Horizontal>
        {!isK8sRule ? (
          renderLink(
            hasCustomDomains ? tableProps.row.original.custom_domains?.join(',') : tableProps.row.original.host_name
          )
        ) : !_isEmpty(tableProps.row.original.routing?.k8s?.CustomDomain) ? (
          renderLink(tableProps.row.original.routing?.k8s?.CustomDomain)
        ) : (
          <Layout.Horizontal flex={{ justifyContent: 'center' }}>
            <Text>{'-'}</Text>
          </Layout.Horizontal>
        )}
      </Layout.Vertical>
      {/* <Icon name={tableProps.row.original.provider.icon as IconName}></Icon> */}
      {tableProps.value}
    </Container>
  )
}

function RenderColumnMenu(
  tableProps: CellProps<Service>,
  { onEdit, onDelete, onStateToggle }: TableRowMenuProps
): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const row = tableProps.row
  const data = row.original.id
  const [menuOpen, setMenuOpen] = useState(false)
  const { triggerToggle } = useToggleRuleState({
    accountId,
    serviceData: row.original,
    onSuccess: (updatedServiceData: Service) => onStateToggle('SUCCESS', updatedServiceData, row.index),
    onFailure: err => onStateToggle('FAILURE', err)
  })
  const { triggerDelete } = useDeleteServiceHook({
    serviceData: row.original,
    accountId,
    onSuccess: (_data: Service) => onDelete('SUCCESS', _data),
    onFailure: err => onDelete('FAILURE', err)
  })

  const handleToggleRuleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    triggerToggle()
  }

  const handleDeleteRuleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    triggerDelete()
  }

  return (
    <Layout.Horizontal className={css.layout}>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.BOTTOM_RIGHT}
      >
        <Button
          minimal
          icon="Options"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
          data-testid={`menu-${data}`}
        />
        <Menu style={{ minWidth: 'unset' }}>
          {row.original.disabled ? (
            <Menu.Item icon="play" text="Enable" onClick={handleToggleRuleClick} />
          ) : (
            <Menu.Item icon="disable" text="Disable" onClick={handleToggleRuleClick} />
          )}
          {row.original.status !== 'submitted' && (
            <Menu.Item icon="edit" text="Edit" onClick={() => onEdit(row.original)} />
          )}
          <Menu.Item icon="trash" text="Delete" onClick={handleDeleteRuleClick} />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const StatusCell = ({ row }: CellProps<Service>) => {
  const { accountId } = useParams<AccountPathProps>()
  const { data, loading } = useGetServiceDiagnostics({
    account_id: accountId, // eslint-disable-line
    rule_id: row.original.id as number, // eslint-disable-line
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const diagnosticsErrors = (data?.response || [])
    .filter(item => !item.success)
    .map(item => ({ action: item.name, error: item.message }))
  const hasError: boolean = !_isEmpty(row.original.metadata?.service_errors) || !_isEmpty(diagnosticsErrors)
  const combinedErrors: ServiceError[] = (row.original.metadata?.service_errors || []).concat(diagnosticsErrors)
  return loading ? (
    <Icon name="spinner" size={12} color="blue500" />
  ) : (
    <TextWithToolTip
      messageText={row.original.status}
      errors={hasError ? combinedErrors : []}
      status={
        row.original.status === 'errored' || hasError ? textWithToolTipStatus.ERROR : textWithToolTipStatus.SUCCESS
      }
      indicatorColor={row.original.status === 'submitted' ? Color.YELLOW_500 : undefined}
    />
  )
}

const EmptyListPage: React.FC<EmptyListPageProps> = () => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const history = useHistory()
  const { trackEvent } = useTelemetry()
  return (
    <Container background={Color.WHITE} height="100vh">
      <NGBreadcrumbs
        links={[
          {
            url: routes.toCECORules({ accountId }),
            label: getString('ce.co.breadCrumb.rules')
          }
        ]}
      />
      <Layout.Vertical
        spacing="large"
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '220px'
        }}
      >
        <img src={landingPageSVG} alt="autostopping-rules" width="500px"></img>
        <Text font="normal" style={{ lineHeight: '24px', textAlign: 'center', width: '760px', marginTop: '20px' }}>
          <String stringID="ce.co.landingPageText" useRichText={true} /> <Link href="/">Learn more</Link>
        </Text>
        <RbacButton
          intent="primary"
          text={getString('ce.co.newAutoStoppingRule')}
          icon="plus"
          featuresProps={{
            featuresRequest: {
              featureNames: [FeatureIdentifier.RESTRICTED_AUTOSTOPPING_RULE_CREATION]
            }
          }}
          onClick={() => {
            history.push(
              routes.toCECOCreateGateway({
                accountId
              })
            )
            trackEvent(USER_JOURNEY_EVENTS.CREATE_NEW_AS_CLICK, {})
          }}
        />
      </Layout.Vertical>
    </Container>
  )
}

const TOTAL_ITEMS_PER_PAGE = 5

interface RulesTableContainerProps {
  rules: Service[]
  setRules: (services: Service[]) => void
  loading: boolean
  rowMenuProps: TableRowMenuProps
  pageProps: { index: number; setIndex: (index: number) => void }
  onRowClick: (data: Service, index: number) => void
  refetchRules: (value: string, isSearchActive: boolean, triggerFetch?: boolean) => Promise<void>
  onSearchCallback?: (value: string) => void
  searchParams: SearchParams
  mode: RulesMode
}

const POLL_TIMER = 1000 * 60 * 1

const useSubmittedRulesStatusUpdate = ({
  rules,
  onRuleUpdate
}: {
  rules: Service[]
  onRuleUpdate?: (params: { updatedService: Service; index: number }) => void
}) => {
  const { accountId } = useParams<AccountPathProps>()
  const { data, refetch, loading } = useRouteDetails({ account_id: accountId, rule_id: 0, lazy: true })
  const rulesToFetch = useRef<{ index: number; rule: Service }[]>([])
  const timer = useRef<NodeJS.Timer | null>(null)

  const clearTimer = () => {
    clearTimeout(timer.current as NodeJS.Timer)
    timer.current = null
  }

  useEffect(() => {
    rulesToFetch.current = []
    clearTimer()
    rules.forEach((r, i) => {
      if (r.status === 'submitted') {
        rulesToFetch.current.push({ index: i, rule: r })
      }
    })
  }, [rules])

  const triggerRuleFetching = () => {
    timer.current = setTimeout(() => {
      refetch({ pathParams: { account_id: accountId, rule_id: rulesToFetch.current[0].rule.id } })
      clearTimer()
    }, POLL_TIMER)
  }

  useEffect(() => {
    if (!_isEmpty(rulesToFetch.current) && !loading && timer.current === null) {
      triggerRuleFetching()
    }
  }, [rulesToFetch.current, timer.current])

  useEffect(() => {
    if (!_isEmpty(data?.response) && data?.response?.service?.status !== 'submitted') {
      onRuleUpdate?.({ updatedService: data?.response?.service as Service, index: rulesToFetch.current[0].index })
      rulesToFetch.current.shift()
      clearTimer()
    }
    if (timer.current) {
      return () => clearTimeout(timer.current as NodeJS.Timer)
    }
  }, [data?.response])
}

const RulesTableContainer: React.FC<RulesTableContainerProps> = ({
  rules,
  setRules,
  loading,
  rowMenuProps: { onDelete, onEdit, onStateToggle },
  pageProps,
  onRowClick,
  refetchRules,
  searchParams,
  mode
}) => {
  const { getString } = useStrings()
  const tableData = rules.slice(
    pageProps.index * TOTAL_ITEMS_PER_PAGE,
    pageProps.index * TOTAL_ITEMS_PER_PAGE + TOTAL_ITEMS_PER_PAGE
  )

  useSubmittedRulesStatusUpdate({
    rules: tableData,
    onRuleUpdate: ({ updatedService, index }) => {
      const updatedRules = [...rules]
      const updatedIndex = pageProps.index * TOTAL_ITEMS_PER_PAGE + index
      updatedRules.splice(updatedIndex, 1, updatedService)
      setRules(updatedRules)
    }
  })

  /* istanbul ignore next */
  const onSearchChange = async (val: string) => {
    val = val.trim()
    await refetchRules(val, true, false)
    pageProps.setIndex(0)
  }

  const handleRefreshClick = () => {
    refetchRules(searchParams.text, !_isEmpty(searchParams.text))
  }

  const emptySearchResults = _isEmpty(rules)
  const currentModeText =
    mode === RulesMode.DRY
      ? getString('ce.co.autoStoppingRule.review.dryRunMode')
      : getString('ce.co.autoStoppingRule.review.activeMode')

  return (
    <Container padding={'xlarge'}>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        <Layout.Horizontal>
          {!emptySearchResults && searchParams.text && !loading ? (
            <Text font={{ variation: FontVariation.H6 }}>
              {getString('ce.co.searchResultsText', {
                count: rules.length,
                text: searchParams.text
              })}
            </Text>
          ) : null}
        </Layout.Horizontal>
        <Layout.Horizontal flex>
          <ExpandingSearchInput
            placeholder={getString('search')}
            onChange={onSearchChange}
            throttle={300}
            alwaysExpanded={true}
            defaultValue={searchParams.text}
          />
        </Layout.Horizontal>
      </Layout.Horizontal>
      <Container margin={{ top: 'medium' }} style={{ position: 'relative' }}>
        {loading ? (
          <Layout.Horizontal style={{ padding: 'var(--spacing-large)', paddingTop: 'var(--spacing-xxxlarge)' }}>
            <PageSpinner />
          </Layout.Horizontal>
        ) : emptySearchResults ? (
          <>
            <Layout.Vertical spacing="large" style={{ alignItems: 'center' }}>
              <img src={NoDataImage} height={150} />
              <Text color="grey800" font="normal" style={{ lineHeight: '25px' }}>
                {getString('ce.co.emptyResultText', {
                  string: Utils.getConditionalResult(searchParams.text.length > 0, searchParams.text, currentModeText)
                })}
              </Text>
            </Layout.Vertical>
          </>
        ) : (
          <>
            <Layout.Horizontal
              className={css.refreshIconContainer}
              onClick={handleRefreshClick}
              data-testid={'refreshIconContainer'}
            >
              <img src={refreshIcon} width={'12px'} height={'12px'} />
              <Text>{getString('common.refresh')}</Text>
            </Layout.Horizontal>
            <TableV2<Service>
              data={tableData}
              pagination={{
                pageSize: TOTAL_ITEMS_PER_PAGE,
                pageIndex: pageProps.index,
                pageCount: Math.ceil(rules.length / TOTAL_ITEMS_PER_PAGE) ?? 1,
                itemCount: rules.length,
                gotoPage: newPageIndex => pageProps.setIndex(newPageIndex)
              }}
              onRowClick={onRowClick}
              columns={[
                {
                  accessor: 'name',
                  Header: getString('ce.co.rulesTableHeaders.name'),
                  width: '18%',
                  Cell: NameCell,
                  disableSortBy: true
                },
                {
                  accessor: 'idle_time_mins',
                  Header: getString('ce.co.rulesTableHeaders.idleTime'),
                  width: '8%',
                  Cell: TimeCell,
                  disableSortBy: true
                },
                {
                  accessor: 'fulfilment',
                  Header: getString('ce.co.rulesTableHeaders.fulfilment'),
                  width: '12%',
                  Cell: IconCell,
                  disableSortBy: true
                },
                {
                  Header: getString('ce.co.rulesTableHeaders.mangedResources'),
                  width: '22%',
                  Cell: ResourcesCell
                },
                {
                  Header: getString('ce.co.rulesTableHeaders.savings').toUpperCase(),
                  width: '15%',
                  Cell: SavingsCell,
                  disableSortBy: true
                },
                {
                  Header: getString('ce.co.rulesTableHeaders.lastActivity'),
                  width: '10%',
                  Cell: ActivityCell
                },
                {
                  Header: getString('ce.co.rulesTableHeaders.status'),
                  width: '10%',
                  Cell: StatusCell
                },
                {
                  Header: '',
                  id: 'menu',
                  accessor: row => row.id,
                  width: '5%',
                  Cell: (cellData: CellProps<Service>) =>
                    RenderColumnMenu(cellData, {
                      onDelete,
                      onEdit,
                      onStateToggle
                    }),
                  disableSortBy: true
                }
              ]}
            />
          </>
        )}
      </Container>
    </Container>
  )
}

const COGatewayList: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { trackEvent } = useTelemetry()
  const { accountId } = useParams<AccountPathProps>()
  const { showSuccess, showError } = useToaster()
  const { featureDetail } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.RESTRICTED_AUTOSTOPPING_RULE_CREATION
    }
  })
  const dryRunModeEnabled = useFeatureFlag(FeatureFlag.CCM_AS_DRY_RUN)

  const [selectedService, setSelectedService] = useState<{ data: Service; index: number } | null>()
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [tableData, setTableData] = useState<Service[]>([])
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [mode, setMode] = useQueryParamsState<RulesMode>('mode', RulesMode.ACTIVE)
  const [searchQueryText, setSearchQueryText] = useQueryParamsState<string | undefined>('search', undefined)

  const [searchParams, setSearchParams] = useState<SearchParams>({
    isActive: !_isEmpty(searchQueryText),
    text: _defaultTo(searchQueryText, '')
  })
  const [isLoadingPage, setIsLoadingPage] = useState(true) // track initial loading of page

  const getServicesQueryParams = React.useMemo(
    () => ({
      accountIdentifier: accountId,
      value: _defaultTo(searchParams.text, ''),
      dry_run: mode === RulesMode.DRY
    }),
    [searchParams.text, mode]
  )

  const {
    data: servicesData,
    error,
    loading,
    refetch: refetchServices
  } = useGetServices({
    account_id: accountId,
    queryParams: {
      ...getServicesQueryParams
    }
  })

  const { data: graphData, loading: graphLoading } = useCumulativeServiceSavings({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId,
      dry_run: mode === RulesMode.DRY
    }
  })

  const triggerServiceFetch = async (value: string, isSearchActive: boolean, triggerFetch = true) => {
    if (triggerFetch) {
      await refetchServices({ queryParams: { ...getServicesQueryParams } })
    }
    setSearchParams({ isActive: isSearchActive, text: value })
    setSearchQueryText(_isEmpty(value) ? undefined : value)
  }

  const trackLandingPage = () => {
    const hasData = !_isEmpty(servicesData?.response)
    const eventName = hasData ? USER_JOURNEY_EVENTS.LOAD_AS_SUMMARY_PAGE : USER_JOURNEY_EVENTS.LOAD_AS_LANDING_PAGE
    if (!loading) {
      trackEvent(eventName, {})
    }
  }

  useEffect(() => {
    if (servicesData) {
      setTableData(_defaultTo(servicesData?.response, []))
      setIsLoadingPage(false) // to stop initial loading of page
    }
    trackLandingPage()
  }, [servicesData?.response])

  if (error) {
    const errMessage = _defaultTo((error.data as any)?.errors?.join(', '), error.message)
    showError(errMessage, undefined, 'ce.get.svc.error')
  }

  /* istanbul ignore next */
  const onServiceStateToggle = (type: 'SUCCESS' | 'FAILURE', data: Service | any, index?: number) => {
    if (type === 'SUCCESS') {
      const currTableData: Service[] = [...tableData]
      currTableData.splice(index as number, 1, data)
      setTableData(currTableData)
      if (!_isEmpty(selectedService)) {
        setSelectedService({ data, index: index as number })
      }
      showSuccess(`Rule ${data.name} ${!data.disabled ? 'enabled' : 'disabled'}`)
    } else {
      showError(_defaultTo(data.data?.errors?.join(', '), ''))
    }
  }

  /* istanbul ignore next */
  const onServiceDeletion = (type: 'SUCCESS' | 'FAILURE', data: Service | any) => {
    if (type === 'SUCCESS') {
      showSuccess(`Rule ${data.name} deleted successfully`)
      if (isDrawerOpen) {
        setIsDrawerOpen(false)
        setSelectedService(null)
      }
      refetchServices()
    } else {
      showError(_defaultTo(data.data?.errors?.join(', '), ''))
    }
  }

  const handleServiceEdit = (_service: Service) =>
    history.push(
      routes.toCECOEditGateway({
        accountId: _service.account_identifier as string,
        gatewayIdentifier: _service.id?.toString() as string
      })
    )

  const handleModeChange = async (val: RulesMode) => {
    setMode(val)
  }

  // Render page loader for initial loading of the page
  if (isLoadingPage) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
        <PageSpinner />
      </div>
    )
  }

  // Render empty page component when:
  // no data is available
  // search is not active
  // and no 'mode' query param is present
  if (!isLoadingPage && mode !== RulesMode.DRY && _isEmpty(tableData) && !searchParams.isActive) {
    return <EmptyListPage featureDetail={featureDetail} />
  }

  // Render summary and table when:
  // without search - data is available
  // with search - data is available or unavailable
  return (
    <Container background={Color.WHITE} height="100vh">
      <PageHeader
        title={
          <Layout.Horizontal flex={{ alignItems: 'center' }}>
            <Heading data-tooltip-id="autostoppingRule" level={2} color={Color.GREY_800} font={{ weight: 'bold' }}>
              {getString('ce.co.breadCrumb.rules')}
            </Heading>
            <HarnessDocTooltip tooltipId="autostoppingRule" useStandAlone={true} />
          </Layout.Horizontal>
        }
        breadcrumbs={<NGBreadcrumbs />}
      />

      <Drawer
        autoFocus={true}
        enforceFocus={true}
        hasBackdrop={true}
        usePortal={true}
        canOutsideClickClose={true}
        canEscapeKeyClose={true}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedService(null)
        }}
        size="656px"
        style={{
          boxShadow: '0px 2px 8px rgba(40, 41, 61, 0.04), 0px 16px 24px rgba(96, 97, 112, 0.16)',
          borderRadius: '8px',
          overflowY: 'scroll'
        }}
      >
        <COGatewayAnalytics
          service={selectedService}
          handleServiceToggle={onServiceStateToggle}
          handleServiceDeletion={onServiceDeletion}
          handleServiceEdit={handleServiceEdit}
        />
      </Drawer>
      <>
        <Layout.Horizontal padding="large">
          <Layout.Horizontal width="55%">
            <RbacButton
              intent="primary"
              text={getString('ce.co.newAutoStoppingRule')}
              icon="plus"
              featuresProps={{
                featuresRequest: {
                  featureNames: [FeatureIdentifier.RESTRICTED_AUTOSTOPPING_RULE_CREATION]
                }
              }}
              onClick={() => {
                history.push(
                  routes.toCECOCreateGateway({
                    accountId
                  })
                )
                trackEvent('StartedMakingAutoStoppingRule', {})
              }}
            />
          </Layout.Horizontal>
        </Layout.Horizontal>
      </>
      <Page.Body className={css.pageContainer}>
        {dryRunModeEnabled && (
          <Layout.Horizontal flex={{ justifyContent: 'center', alignItems: 'center' }} padding="medium">
            <PillToggle
              selectedView={mode}
              options={[
                {
                  label: getString('ce.co.activeMode'),
                  value: RulesMode.ACTIVE
                },
                {
                  label: getString('ce.co.dryRunMode'),
                  value: RulesMode.DRY
                }
              ]}
              className={css.modeToggle}
              onChange={handleModeChange}
            />
          </Layout.Horizontal>
        )}
        <COGatewayCumulativeAnalytics data={graphData?.response} loadingData={graphLoading} mode={mode} />
        <RulesTableContainer
          rules={tableData}
          setRules={setTableData}
          loading={loading}
          onRowClick={(e, index) => {
            setSelectedService({ data: e, index })
            setIsDrawerOpen(true)
          }}
          pageProps={{ index: pageIndex, setIndex: setPageIndex }}
          refetchRules={triggerServiceFetch}
          rowMenuProps={{
            onDelete: onServiceDeletion,
            onEdit: handleServiceEdit,
            onStateToggle: onServiceStateToggle
          }}
          searchParams={searchParams}
          mode={mode}
        />
      </Page.Body>
    </Container>
  )
}

export default COGatewayList
