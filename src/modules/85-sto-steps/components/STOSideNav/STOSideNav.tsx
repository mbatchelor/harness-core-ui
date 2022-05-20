/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Layout } from '@wings-software/uicore'
import { Tabs, Tab } from '@blueprintjs/core'
import routes from '@common/RouteDefinitions'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { ProjectSelector } from '@projects-orgs/components/ProjectSelector/ProjectSelector'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import css from './STOSideNav.module.scss'

export default function STOSideNav(): React.ReactElement {
  const { getString } = useStrings()
  const { accountId, projectIdentifier } = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()
  const history = useHistory()
  const [isProjectMode, setIsProjectMode] = useState<boolean>(!!projectIdentifier)
  // Telemetry?

  const toProjectMode = () => {
    setIsProjectMode(true)
    if (selectedProject?.identifier) {
      history.push(
        routes.toSTOProjectOverview({
          accountId,
          projectIdentifier: selectedProject.identifier,
          orgIdentifier: selectedProject.orgIdentifier || /* istanbul ignore next */ ''
        })
      )
    }
  }

  const toAccountMode = () => {
    setIsProjectMode(false)
    history.push(routes.toSTOOverview({ accountId }))
  }

  return (
    <Layout.Vertical spacing="small">
      <Tabs id="navTab" selectedTabId={isProjectMode ? 'project' : 'account'} className={css.sideNavTabs}>
        <Tab id="account" title={getString('account')} onClickCapture={toAccountMode} panel={<TabPanel />} />
        <Tabs.Expander />
        <Tab
          id="project"
          title={getString('projectLabel')}
          onClickCapture={toProjectMode}
          panel={<TabPanel isProjectMode />}
        />
      </Tabs>
    </Layout.Vertical>
  )
}

interface TabPanelProps {
  isProjectMode?: boolean
}

const TabPanel: React.FC<TabPanelProps> = ({ isProjectMode }) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const { updateAppStore } = useAppStore()
  const history = useHistory()
  // Telemetry?

  const showLinks = !isProjectMode || projectIdentifier
  const params: ProjectPathProps & ModulePathParams & { accountId: string } = {
    accountId,
    projectIdentifier,
    orgIdentifier,
    module: 'sto'
  }

  return (
    <Layout.Vertical spacing="small" className={isProjectMode ? css.projectPanel : undefined}>
      {isProjectMode && (
        <ProjectSelector
          onSelect={selectedProject => {
            updateAppStore({ selectedProject: selectedProject })
            history.push(
              routes.toSTOProjectOverview({
                accountId,
                projectIdentifier: selectedProject.identifier,
                orgIdentifier: selectedProject.orgIdentifier || /* istanbul ignore next */ ''
              })
            )
          }}
        />
      )}

      {showLinks && (
        <React.Fragment>
          {isProjectMode ? (
            <>
              <SidebarLink label={getString('overview')} to={routes.toSTOProjectOverview(params)} />
              <SidebarLink label={getString('common.purpose.sto.continuous')} to={routes.toDeployments(params)} />
              <SidebarLink label={getString('pipelines')} to={routes.toPipelines(params)} />
              <SidebarLink label={getString('stoSteps.targets.testTargets')} to={routes.toSTOProjectTargets(params)} />
            </>
          ) : (
            <>
              <SidebarLink label={getString('overview')} to={routes.toSTOOverview({ accountId })} />
              <SidebarLink label={getString('stoSteps.targets.testTargets')} to={routes.toSTOTargets({ accountId })} />
            </>
          )}
        </React.Fragment>
      )}
    </Layout.Vertical>
  )
}
