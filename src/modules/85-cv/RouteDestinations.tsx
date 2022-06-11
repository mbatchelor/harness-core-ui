/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, useParams, Redirect } from 'react-router-dom'

import { parse } from 'yaml'
import CVHomePage from '@cv/pages/home/CVHomePage'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import { accountPathProps, projectPathProps, templatePathProps } from '@common/utils/routeUtils'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { MinimalLayout } from '@common/layouts'

import './components/PipelineSteps'
import './components/MonitoredServiceTemplate'
import './components/ExecutionVerification'
import CVMonitoredService from '@cv/pages/monitored-service/CVMonitoredService/CVMonitoredService'
import MonitoredServicePage from '@cv/pages/monitored-service/MonitoredServicePage'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import SideNav from '@cv/components/SideNav/SideNav'
import { SecretRouteDestinations } from '@secrets/RouteDestinations'
import { ConnectorRouteDestinations } from '@connectors/RouteDestinations'
import { DelegateRouteDestinations } from '@delegates/RouteDestinations'
import { AccessControlRouteDestinations } from '@rbac/RouteDestinations'
import { VariableRouteDestinations } from '@variables/RouteDestinations'
import { ModuleName } from 'framework/types/ModuleName'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { PubSubPipelineActions } from '@pipeline/factories/PubSubPipelineAction'
import { PipelineActions } from '@pipeline/factories/PubSubPipelineAction/types'
import { TemplateStudioWrapper } from '@templates-library/components/TemplateStudio/TemplateStudioWrapper'
import { inputSetTemplatePromise } from 'services/cv'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { CVChanges } from '@cv/pages/changes/CVChanges'
import CVTrialHomePage from './pages/home/CVTrialHomePage'
import { editParams, isVerifyStepPresent } from './utils/routeUtils'
import CVSLOsListingPage from './pages/slos/CVSLOsListingPage'
import CVSLODetailsPage from './pages/slos/CVSLODetailsPage/CVSLODetailsPage'
import CVCreateSLO from './pages/slos/components/CVCreateSLO/CVCreateSLO'
import ChildAppMounter from '../../microfrontends/ChildAppMounter'
import { ErrorTracking } from './ErrorTrackingApp'

PubSubPipelineActions.subscribe(
  PipelineActions.RunPipeline,
  async ({ template, accountPathProps: accountPathParams, pipeline }) => {
    let response = { ...template }
    const payload = { pipelineYaml: yamlStringify({ pipeline }), templateYaml: yamlStringify(template) }

    // Making the BE call to get the updated template, only if the stage contains verify step then
    if (isVerifyStepPresent(pipeline)) {
      const updatedResponse = await inputSetTemplatePromise({
        queryParams: { accountId: accountPathParams?.accountId },
        body: payload
      })
      if (updatedResponse?.data?.inputSetTemplateYaml) {
        response = { ...parse(updatedResponse.data.inputSetTemplateYaml)?.pipeline }
      }
    }
    return Promise.resolve(response)
  }
)

const RedirectToCVProject = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()

  if (selectedProject?.modules?.includes(ModuleName.CV)) {
    return (
      <Redirect
        to={routes.toCVMonitoringServices({
          accountId: params.accountId,
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier
        })}
      />
    )
  } else {
    return <Redirect to={routes.toCVHome(params)} />
  }
}

export const cvModuleParams: ModulePathParams = {
  module: ':module(cv)'
}

const CVSideNavProps: SidebarContext = {
  navComponent: SideNav,
  subtitle: 'Service',
  title: 'Reliability',
  icon: 'cv-main'
}

export default (
  <>
    <Route
      path={[routes.toCV({ ...accountPathProps }), routes.toCVProject({ ...accountPathProps, ...projectPathProps })]}
      exact
    >
      <RedirectToCVProject />
    </Route>
    <RouteWithLayout exact sidebarProps={CVSideNavProps} path={routes.toCVHome({ ...accountPathProps })}>
      <CVHomePage />
    </RouteWithLayout>

    <RouteWithLayout
      layout={MinimalLayout}
      path={routes.toModuleTrialHome({ ...accountPathProps, module: 'cv' })}
      exact
    >
      <CVTrialHomePage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVMonitoringServices({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <CVMonitoredService />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVChanges({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <CVChanges />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVSLOs({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <CVSLOsListingPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={routes.toErrorTracking({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <ChildAppMounter ChildApp={ErrorTracking} />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVCreateSLOs({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <CVCreateSLO />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVSLODetailsPage({
        ...accountPathProps,
        ...projectPathProps,
        ...editParams,
        ...cvModuleParams
      })}
    >
      <CVSLODetailsPage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={[
        routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
        routes.toCVAddMonitoringServicesEdit({
          ...accountPathProps,
          ...projectPathProps,
          ...editParams,
          ...cvModuleParams
        })
      ]}
    >
      <MonitoredServicePage />
    </RouteWithLayout>

    {/* Replace TemplateStudioWrapper route with following code once BE integration is complete: */}
    {/*{*/}
    {/*  TemplateRouteDestinations({*/}
    {/*    moduleParams,*/}
    {/*    sidebarProps: CVSideNavProps*/}
    {/*  })?.props.children*/}
    {/*}*/}
    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      exact
      path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...cvModuleParams })}
    >
      <TemplateStudioWrapper />
    </RouteWithLayout>
    {/* Replace above route once BE integration is complete */}

    {
      SecretRouteDestinations({
        moduleParams: cvModuleParams,
        sidebarProps: CVSideNavProps
      })?.props.children
    }

    {
      VariableRouteDestinations({
        moduleParams: cvModuleParams,
        sidebarProps: CVSideNavProps
      })?.props.children
    }

    {
      DelegateRouteDestinations({
        moduleParams: cvModuleParams,
        sidebarProps: CVSideNavProps
      })?.props.children
    }

    {
      ConnectorRouteDestinations({
        moduleParams: cvModuleParams,
        sidebarProps: CVSideNavProps
      })?.props.children
    }

    {
      AccessControlRouteDestinations({
        moduleParams: cvModuleParams,
        sidebarProps: CVSideNavProps
      })?.props.children
    }
  </>
)
