/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { HarnessDocTooltip, Icon, Tabs } from '@wings-software/uicore'
import { Switch } from '@blueprintjs/core'
import { NavLink, useParams, useLocation, matchPath } from 'react-router-dom'

import routes from '@common/RouteDefinitions'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { accountPathProps, executionPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import type { CIWebhookInfoDTO } from 'services/ci'
import type { ExecutionQueryParams } from '@pipeline/utils/executionUtils'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { useStrings } from 'framework/strings'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { SavedExecutionViewTypes } from '@pipeline/components/LogsContent/LogsContent'
import css from './ExecutionTabs.module.scss'

const TAB_ID_MAP = {
  PIPELINE: 'pipeline_view',
  INPUTS: 'inputs_view',
  ARTIFACTS: 'artifacts_view',
  COMMITS: 'commits_view',
  TESTS: 'tests_view',
  POLICY_EVALUATIONS: 'policy_evaluations',
  STO_SECURITY: 'sto_security'
}

interface ExecutionTabsProps {
  children?: React.ReactChild
  savedExecutionView: string | undefined
  setSavedExecutionView: (data: string) => void
}

export default function ExecutionTabs(props: ExecutionTabsProps): React.ReactElement {
  const [selectedTabId, setSelectedTabId] = React.useState('')
  const { children, savedExecutionView, setSavedExecutionView } = props
  const { getString } = useStrings()
  const { pipelineExecutionDetail, isPipelineInvalid } = useExecutionContext()
  const initialSelectedView = savedExecutionView || SavedExecutionViewTypes.GRAPH
  const params = useParams<PipelineType<ExecutionPathProps>>()
  const location = useLocation()
  const { view } = useQueryParams<ExecutionQueryParams>()
  const { updateQueryParams } = useUpdateQueryParams<ExecutionQueryParams>()
  const opaBasedGovernanceEnabled = useFeatureFlag(FeatureFlag.OPA_PIPELINE_GOVERNANCE)
  const stoCDPipelineSecurityEnabled = useFeatureFlag(FeatureFlag.STO_CD_PIPELINE_SECURITY)
  const stoCIPipelineSecurityEnabled = useFeatureFlag(FeatureFlag.STO_CI_PIPELINE_SECURITY)

  const routeParams = { ...accountPathProps, ...executionPathProps, ...pipelineModuleParams }
  const isLogView =
    view === SavedExecutionViewTypes.LOG || (!view && initialSelectedView === SavedExecutionViewTypes.LOG)
  const isCD = params.module === 'cd'
  const isCI = params.module === 'ci'
  const isCIInPipeline = pipelineExecutionDetail?.pipelineExecutionSummary?.moduleInfo?.ci

  const ciData = pipelineExecutionDetail?.pipelineExecutionSummary?.moduleInfo?.ci
    ?.ciExecutionInfoDTO as CIWebhookInfoDTO
  // NOTE: hide commits tab if there are no commits
  // by default we are showing Commits tab > 'isEmpty(pipelineExecutionDetail)'
  const ciShowCommitsTab = !!ciData?.branch?.commits?.length || !!ciData?.pullRequest?.commits?.length

  function handleLogViewChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { checked } = e.target as HTMLInputElement

    updateQueryParams({
      view: checked ? SavedExecutionViewTypes.LOG : SavedExecutionViewTypes.GRAPH,
      filterAnomalous: 'false',
      type: getString('pipeline.verification.analysisTab.metrics')
    })
    setSavedExecutionView(checked ? SavedExecutionViewTypes.LOG : SavedExecutionViewTypes.GRAPH)
  }

  React.useEffect(() => {
    const isPipeLineView = !!matchPath(location.pathname, {
      path: routes.toExecutionPipelineView(routeParams)
    })
    if (isPipeLineView) {
      return setSelectedTabId(TAB_ID_MAP.PIPELINE)
    }
    const isInputsView = !!matchPath(location.pathname, {
      path: routes.toExecutionInputsView(routeParams)
    })
    if (isInputsView) {
      return setSelectedTabId(TAB_ID_MAP.INPUTS)
    }
    const isArtifactsView = !!matchPath(location.pathname, {
      path: routes.toExecutionArtifactsView(routeParams)
    })
    if (isArtifactsView) {
      return setSelectedTabId(TAB_ID_MAP.ARTIFACTS)
    }
    const isCommitsView = !!matchPath(location.pathname, {
      path: routes.toExecutionCommitsView(routeParams)
    })
    if (isCommitsView) {
      return setSelectedTabId(TAB_ID_MAP.COMMITS)
    }
    const isTestsView = !!matchPath(location.pathname, {
      path: routes.toExecutionTestsView(routeParams)
    })
    if (isTestsView) {
      return setSelectedTabId(TAB_ID_MAP.TESTS)
    }
    const isPolicyEvaluationsView = !!matchPath(location.pathname, {
      path: routes.toExecutionPolicyEvaluationsView(routeParams)
    })
    if (isPolicyEvaluationsView) {
      return setSelectedTabId(TAB_ID_MAP.POLICY_EVALUATIONS)
    }
    const isSecurityView = !!matchPath(location.pathname, {
      path: routes.toExecutionSecurityView(routeParams)
    })
    if (isSecurityView) {
      return setSelectedTabId(TAB_ID_MAP.STO_SECURITY)
    }
    // Defaults to Pipelines Tab
    return setSelectedTabId(TAB_ID_MAP.PIPELINE)
  }, [location.pathname])

  const tabList = [
    {
      id: TAB_ID_MAP.PIPELINE,
      title: (
        <NavLink
          to={routes.toExecutionPipelineView(params) + location.search}
          className={css.tabLink}
          activeClassName={css.activeLink}
        >
          <Icon name="alignment-vertical-center" size={16} />
          <span>{getString('common.pipeline')}</span>
        </NavLink>
      )
    }
  ]

  if (!isPipelineInvalid) {
    tabList.push({
      id: TAB_ID_MAP.INPUTS,
      title: (
        <NavLink
          to={routes.toExecutionInputsView(params) + location.search}
          className={css.tabLink}
          activeClassName={css.activeLink}
        >
          <Icon name="manually-entered-data" size={16} />
          <span>{getString('inputs')}</span>
        </NavLink>
      )
    })
  }

  if (opaBasedGovernanceEnabled) {
    tabList.push({
      id: TAB_ID_MAP.POLICY_EVALUATIONS,
      title: (
        <NavLink
          to={routes.toExecutionPolicyEvaluationsView(params) + location.search}
          className={css.tabLink}
          activeClassName={css.activeLink}
        >
          <Icon name="governance" size={16} />
          <span>{getString('pipeline.policyEvaluations.title')}</span>
        </NavLink>
      )
    })
  }

  if (isCI) {
    tabList.push({
      id: TAB_ID_MAP.ARTIFACTS,
      title: (
        <NavLink
          to={routes.toExecutionArtifactsView(params) + location.search}
          className={css.tabLink}
          activeClassName={css.activeLink}
        >
          <Icon name="add-to-artifact" size={16} />
          <span>{getString('artifacts')}</span>
        </NavLink>
      )
    })
    if (ciShowCommitsTab) {
      tabList.push({
        id: TAB_ID_MAP.COMMITS,
        title: (
          <NavLink
            to={routes.toExecutionCommitsView(params) + location.search}
            className={css.tabLink}
            activeClassName={css.activeLink}
          >
            <Icon name="git-commit" size={16} />
            <span>{getString('commits')}</span>
          </NavLink>
        )
      })
    }
  }

  if (isCI || isCIInPipeline) {
    tabList.push({
      id: TAB_ID_MAP.TESTS,
      title: (
        <NavLink
          to={routes.toExecutionTestsView(params) + location.search}
          className={css.tabLink}
          activeClassName={css.activeLink}
        >
          <Icon name="lab-test" size={16} />
          <span>{getString('tests')}</span>
        </NavLink>
      )
    })
  }

  if ((isCD && stoCDPipelineSecurityEnabled) || (isCI && stoCIPipelineSecurityEnabled)) {
    tabList.push({
      id: TAB_ID_MAP.STO_SECURITY,
      title: (
        <NavLink
          to={routes.toExecutionSecurityView(params) + location.search}
          className={css.tabLink}
          activeClassName={css.activeLink}
        >
          <Icon name="sto-grey" size={16} />
          <span>{getString('common.purpose.sto.continuous')}</span>
        </NavLink>
      )
    })
  }

  return (
    <div className={css.main}>
      <div>
        <Tabs id="execution-tabs" selectedTabId={selectedTabId} renderAllTabPanels={false} tabList={tabList} />
      </div>
      <div className={css.children}>{children}</div>
      {selectedTabId === TAB_ID_MAP.PIPELINE ? (
        <div className={css.viewToggle}>
          <span data-tooltip-id="consoleViewToggle">{getString('consoleView')}</span>
          <Switch checked={isLogView} name="console-view-toggle" onChange={handleLogViewChange} />
          <HarnessDocTooltip tooltipId="consoleViewToggle" useStandAlone={true} />
        </div>
      ) : null}
    </div>
  )
}
