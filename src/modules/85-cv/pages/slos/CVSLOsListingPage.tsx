/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useMemo, useReducer } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  useToaster,
  ButtonVariation,
  CardSelect,
  CardSelectType,
  Card,
  NoDataCard,
  Pagination,
  Layout,
  FlexExpander,
  Container,
  Heading,
  HarnessDocTooltip,
  SelectOption
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import slosEmptyState from '@cv/assets/slosEmptyState.svg'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import {
  useDeleteSLOData,
  useGetAllJourneys,
  useGetAllMonitoredServicesWithTimeSeriesHealthSources,
  useGetSLODashboardWidgets,
  useGetServiceLevelObjectivesRiskCount,
  RiskCount,
  useResetErrorBudget,
  SLOErrorBudgetResetDTO
} from 'services/cv'
import RbacButton from '@rbac/components/Button/Button'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import SLOCardSelect from './components/SLOCardSelect/SLOCardSelect'
import type { CVSLOsListingPageProps, SLORiskFilter } from './CVSLOsListingPage.types'
import _ from 'lodash'
import {
  getErrorObject,
  getIsSLODashboardAPIsLoading,
  getSLORiskTypeFilter,
  getIsWidgetDataEmpty,
  getIsSetPreviousPage,
  sloFilterReducer,
  SLODashboardFilterActions,
  getInitialFilterStateLazy,
  getSLODashboardWidgetsParams,
  getServiceLevelObjectivesRiskCountParams,
  getUserJourneyParams,
  getMonitoredServicesInitialState,
  getInitialFilterState,
  getClassNameForMonitoredServicePage,
  getIsDataEmpty
} from './CVSLOListingPage.utils'
import SLODashbordFilters from './components/SLODashbordFilters/SLODashbordFilters'
import SLOCardHeader from './SLOCard/SLOCardHeader'
import SLOCardContent from './SLOCard/SLOCardContent'
import css from './CVSLOsListingPage.module.scss'

const CVSLOsListingPage: React.FC<CVSLOsListingPageProps> = ({ monitoredService }) => {
  const history = useHistory()
  const { getString } = useStrings()

  useDocumentTitle([
    getString('cv.srmTitle'),
    monitoredService?.identifier ? getString('cv.monitoredServices.title') : getString('cv.slos.title')
  ])

  const { showError, showSuccess } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const [filterState, dispatch] = useReducer(sloFilterReducer, getInitialFilterState(getString), passedInitialState =>
    getInitialFilterStateLazy(passedInitialState, monitoredService)
  )

  useEffect(() => {
    if (monitoredService?.identifier) {
      dispatch(SLODashboardFilterActions.updateMonitoredServices(getMonitoredServicesInitialState(monitoredService)))
    }
  }, [monitoredService])
  const [pageNumber, setPageNumber] = useState(0)

  useEffect(() => {
    setPageNumber(0)
  }, [projectIdentifier])

  const pathParams = useMemo(() => {
    return {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  }, [accountId, orgIdentifier, projectIdentifier])

  const {
    data: dashboardWidgetsResponse,
    loading: dashboardWidgetsLoading,
    refetch: refetchDashboardWidgets,
    error: dashboardWidgetsError
  } = useGetSLODashboardWidgets(getSLODashboardWidgetsParams(pathParams, getString, filterState, pageNumber))

  const {
    data: riskCountResponse,
    loading: riskCountLoading,
    refetch: refetchRiskCount,
    error: dashboardRiskCountError
  } = useGetServiceLevelObjectivesRiskCount(
    getServiceLevelObjectivesRiskCountParams(pathParams, getString, filterState)
  )

  const {
    data: monitoredServicesData,
    loading: monitoredServicesLoading,
    error: monitoredServicesDataError,
    refetch: refetchMonitoredServicesData
  } = useGetAllMonitoredServicesWithTimeSeriesHealthSources({
    queryParams: pathParams
  })

  const {
    content,
    totalItems = 0,
    totalPages = 0,
    pageIndex = 0,
    pageItemCount = 0,
    pageSize = 10
  } = dashboardWidgetsResponse?.data ?? {}

  const {
    data: userJourneysData,
    loading: userJourneysLoading,
    error: userJourneysError,
    refetch: refetchUserJourneys
  } = useGetAllJourneys(getUserJourneyParams(pathParams))

  const { mutate: deleteSLO, loading: deleteSLOLoading } = useDeleteSLOData({
    queryParams: pathParams
  })

  const onDelete = async (identifier: string, name: string): Promise<void> => {
    try {
      await deleteSLO(identifier)
      if (getIsSetPreviousPage(pageIndex, pageItemCount)) {
        setPageNumber(prevPageNumber => prevPageNumber - 1)
      } else {
        await refetchDashboardWidgets()
      }
      await refetchRiskCount()
      showSuccess(getString('cv.slos.sloDeleted', { name }))
    } catch (e) {
      showError(getErrorMessage(e))
    }
  }

  const { mutate: resetErrorBudget, loading: resetErrorBudgetLoading } = useResetErrorBudget({
    identifier: '',
    queryParams: pathParams
  })

  const onResetErrorBudget = async (identifier: string, formData: SLOErrorBudgetResetDTO): Promise<void> => {
    try {
      await resetErrorBudget(formData, { pathParams: { identifier } })
      await Promise.all([refetchDashboardWidgets(), refetchRiskCount()])

      showSuccess(getString('cv.errorBudgetIsSuccessfullyReset'))
    } catch (e) {
      showError(getErrorMessage(e))
    }
  }

  const getAddSLOButton = (): JSX.Element => (
    <RbacButton
      icon="plus"
      text={getString('cv.slos.createSLO')}
      variation={ButtonVariation.PRIMARY}
      onClick={() => {
        history.push({
          pathname: routes.toCVCreateSLOs({ accountId, orgIdentifier, projectIdentifier, module: 'cv' }),
          search: monitoredService?.identifier ? `?monitoredServiceIdentifier=${monitoredService.identifier}` : ''
        })
      }}
      className={getClassNameForMonitoredServicePage(css.createSloInMonitoredService, monitoredService?.identifier)}
      permission={{
        permission: PermissionIdentifier.EDIT_SLO_SERVICE,
        resource: {
          resourceType: ResourceType.SLO,
          resourceIdentifier: projectIdentifier
        }
      }}
    />
  )

  const onFilter = (currentRiskFilter: SLORiskFilter): void => {
    setPageNumber(0)
    const { updateSloRiskType } = SLODashboardFilterActions
    if (filterState.sloRiskFilter?.identifier === currentRiskFilter.identifier) {
      dispatch(updateSloRiskType({ sloRiskFilter: null }))
    } else {
      dispatch(updateSloRiskType({ sloRiskFilter: currentRiskFilter }))
    }
  }

  const filterItemsData = useMemo(
    () => ({ userJourney: userJourneysData, monitoredServices: monitoredServicesData }),
    [userJourneysData, monitoredServicesData]
  )

  return (
    <>
      {!monitoredService?.identifier && !!riskCountResponse?.data?.riskCounts && (
        <>
          <Page.Header
            breadcrumbs={<NGBreadcrumbs />}
            title={
              <Heading level={3} font={{ variation: FontVariation.H4 }}>
                {getString('cv.slos.title')}
                <HarnessDocTooltip tooltipId={'sloDashboardTitle'} useStandAlone />
              </Heading>
            }
          />
          <Page.Header title={getAddSLOButton()} />
        </>
      )}

      <Page.Body
        loading={getIsSLODashboardAPIsLoading(
          userJourneysLoading,
          dashboardWidgetsLoading,
          deleteSLOLoading,
          monitoredServicesLoading,
          riskCountLoading,
          resetErrorBudgetLoading
        )}
        error={getErrorMessage(
          getErrorObject(dashboardWidgetsError, userJourneysError, dashboardRiskCountError, monitoredServicesDataError)
        )}
        retryOnError={() => {
          if (dashboardWidgetsError) {
            refetchDashboardWidgets()
          }
          if (userJourneysError) {
            refetchUserJourneys()
          }
          if (monitoredServicesDataError) {
            refetchMonitoredServicesData()
          }

          if (dashboardRiskCountError) {
            refetchRiskCount()
          }
        }}
        className={css.pageBody}
      >
        <Layout.Vertical height="100%" padding={{ top: 'medium', left: 'xlarge', right: 'xlarge', bottom: 'xlarge' }}>
          <Layout.Horizontal className={css.sloFiltersRow1}>
            {monitoredService?.identifier && getAddSLOButton()}
            <Container
              className={getClassNameForMonitoredServicePage(css.sloDropdownFilters, monitoredService?.identifier)}
            >
              <SLODashbordFilters
                filterState={filterState}
                dispatch={dispatch}
                filterItemsData={filterItemsData}
                hideMonitoresServicesFilter={Boolean(monitoredService)}
              />
            </Container>
          </Layout.Horizontal>
          <CardSelect<SLORiskFilter>
            type={CardSelectType.CardView}
            data={getSLORiskTypeFilter(
              getString,
              riskCountResponse?.data?.riskCounts as RiskCount[] | undefined,
              riskCountResponse?.data?.totalCount
            )}
            cardClassName={css.sloRiskFilterCard}
            renderItem={({ ...props }) => <SLOCardSelect key={props.identifier} {...props} />}
            selected={filterState.sloRiskFilter as SLORiskFilter}
            onChange={onFilter}
          />
          <hr />
          {!!content?.length && (
            <>
              <div className={css.sloCardContainer} data-testid="slo-card-container">
                {content.map(serviceLevelObjective => (
                  <Card key={serviceLevelObjective.sloIdentifier} className={css.sloCard}>
                    <SLOCardHeader
                      onDelete={onDelete}
                      onResetErrorBudget={onResetErrorBudget}
                      serviceLevelObjective={serviceLevelObjective}
                      monitoredServiceIdentifier={monitoredService?.identifier}
                    />
                    <SLOCardContent serviceLevelObjective={serviceLevelObjective} />
                  </Card>
                ))}
              </div>
              <FlexExpander />
              <Pagination
                itemCount={totalItems}
                pageCount={totalPages}
                pageIndex={pageIndex}
                pageSize={pageSize}
                gotoPage={setPageNumber}
              />
            </>
          )}

          {getIsWidgetDataEmpty(content?.length, dashboardWidgetsLoading) && (
            // <NoDataCard
            //   image={slosEmptyState}
            //   messageTitle= {monitoredService?.identifier} ? {getString('cv.slos.noDataMS')}
            //   : {getIsWidgetDataEmpty(content?.length, dashboardWidgetsLoading)} ? getString('cv.slos.noData') : getString('cv.slos.noMatchingData')
            //   message={getString('cv.slos.noSLOsStateMessage')}
            //   className={css.noSloData}
            // />
            <NoDataCard
              image={slosEmptyState}
              messageTitle={
                monitoredService?.identifier
                  ? getString('cv.slos.noDataMS')
                  : !riskCountResponse?.data?.riskCounts ||
                    _.isEmpty(_.filter(_.compact(_.values(filterState)), ({ label }: SelectOption) => label !== 'All'))
                  ? getString('cv.slos.noData')
                  : getString('cv.slos.noMatchingData')
              }
              message={getString('cv.slos.noSLOsStateMessage')}
              className={css.noSloData}
            />
            // <NoDataCard image={slosEmptyState} message={getString('cv.slos.noMatchingData')} />
          )}
        </Layout.Vertical>
      </Page.Body>
    </>
  )
}
export default CVSLOsListingPage
