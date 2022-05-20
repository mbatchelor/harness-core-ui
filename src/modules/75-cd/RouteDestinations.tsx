/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, useParams, Redirect } from 'react-router-dom'
import { useQueryParams } from '@common/hooks'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { RouteWithLayout } from '@common/router'
import { EmptyLayout, MinimalLayout } from '@common/layouts'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import {
  accountPathProps,
  projectPathProps,
  pipelinePathProps,
  triggerPathProps,
  connectorPathProps,
  secretPathProps,
  executionPathProps,
  inputSetFormPathProps,
  orgPathProps,
  rolePathProps,
  resourceGroupPathProps,
  delegatePathProps,
  delegateConfigProps,
  userPathProps,
  userGroupPathProps,
  serviceAccountProps,
  servicePathProps,
  templatePathProps,
  environmentGroupPathProps,
  environmentPathProps
} from '@common/utils/routeUtils'
import type {
  PipelinePathProps,
  ExecutionPathProps,
  ProjectPathProps,
  PipelineType,
  ModulePathParams,
  Module
} from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'

import { String as LocaleString } from 'framework/strings'
import featureFactory, { RenderMessageReturn } from 'framework/featureStore/FeaturesFactory'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import CDSideNav from '@cd/components/CDSideNav/CDSideNav'
import CDHomePage from '@cd/pages/home/CDHomePage'
import CDDashboardPage from '@cd/pages/dashboard/CDDashboardPage'
import DeploymentsList from '@pipeline/pages/deployments-list/DeploymentsList'
import CDPipelineStudio from '@cd/pages/pipeline-studio/CDPipelineStudio'
import PipelinesPage from '@pipeline/pages/pipelines/PipelinesPage'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'
import DelegatesPage from '@delegates/pages/delegates/DelegatesPage'
import DelegateListing from '@delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@delegates/pages/delegates/DelegateConfigurations'
import DelegateDetails from '@delegates/pages/delegates/DelegateDetails'
import DelegateProfileDetails from '@delegates/pages/delegates/DelegateConfigurationDetailPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import { RedirectToSecretDetailHome } from '@secrets/RouteDestinations'
import SecretReferences from '@secrets/pages/secretReferences/SecretReferences'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import InputSetList from '@pipeline/pages/inputSet-list/InputSetList'
import TriggersPage from '@triggers/pages/triggers/TriggersPage'
import TriggersWizardPage from '@triggers/pages/triggers/TriggersWizardPage'
import ExecutionLandingPage from '@pipeline/pages/execution/ExecutionLandingPage/ExecutionLandingPage'
import ExecutionPipelineView from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionPipelineView'
import ExecutionArtifactsView from '@pipeline/pages/execution/ExecutionArtifactsView/ExecutionArtifactsView'
import ExecutionInputsView from '@pipeline/pages/execution/ExecutionInputsView/ExecutionInputsView'
import PipelineDetails from '@pipeline/pages/pipeline-details/PipelineDetails'
import TriggerDetails from '@triggers/pages/trigger-details/TriggerDetails'
import CDPipelineDeploymentList from '@cd/pages/pipeline-deployment-list/CDPipelineDeploymentList'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { EnhancedInputSetForm } from '@pipeline/components/InputSetForm/InputSetForm'
import TriggersDetailPage from '@triggers/pages/triggers/TriggersDetailPage'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import CreateSecretFromYamlPage from '@secrets/pages/createSecretFromYaml/CreateSecretFromYamlPage'
import { Services } from '@cd/components/Services/Services'
import ChildAppMounter from 'microfrontends/ChildAppMounter'

import './components/PipelineSteps'
import './components/PipelineStudio/DeployStage'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import UsersPage from '@rbac/pages/Users/UsersPage'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import Roles from '@rbac/pages/Roles/Roles'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import GitSyncPage from '@gitsync/pages/GitSyncPage'
import GitSyncRepoTab from '@gitsync/pages/repos/GitSyncRepoTab'
import GitSyncEntityTab from '@gitsync/pages/entities/GitSyncEntityTab'
import GitSyncErrors from '@gitsync/pages/errors/GitSyncErrors'
import BuildTests from '@pipeline/pages/execution/ExecutionTestView/BuildTests'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import executionFactory from '@pipeline/factories/ExecutionFactory'
import { StageType } from '@pipeline/utils/stageHelpers'
import RbacFactory from '@rbac/factories/RbacFactory'
import { TriggerFormType } from '@pipeline/factories/ArtifactTriggerInputFactory/types'
import TriggerFactory from '@pipeline/factories/ArtifactTriggerInputFactory/index'
import ExecutionPolicyEvaluationsView from '@pipeline/pages/execution/ExecutionPolicyEvaluationsView/ExecutionPolicyEvaluationsView'
import ExecutionSecurityView from '@pipeline/pages/execution/ExecutionSecurityView/ExecutionSecurityView'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { LicenseRedirectProps, LICENSE_STATE_NAMES } from 'framework/LicenseStore/LicenseStoreContext'
import { isCommunityPlan } from '@common/utils/utils'
import { TemplateStudioWrapper } from '@templates-library/components/TemplateStudio/TemplateStudioWrapper'
import TemplatesPage from '@templates-library/pages/TemplatesPage/TemplatesPage'
import { GovernanceRouteDestinations } from '@governance/RouteDestinations'
import GitSyncConfigTab from '@gitsync/pages/config/GitSyncConfigTab'
import FullPageLogView from '@pipeline/pages/full-page-log-view/FullPageLogView'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import type { ModuleListCardProps } from '@projects-orgs/components/ModuleListCard/ModuleListCard'
import VariablesPage from '@variables/pages/variables/VariablesPage'
import { Environments } from './components/Environments/Environments'
import { Environments as EnvironmentsV2 } from './components/EnvironmentsV2/Environments'
import EnvironmentDetails from './components/EnvironmentsV2/EnvironmentDetails/EnvironmentDetails'
import EnvironmentGroups from './components/EnvironmentGroups/EnvironmentGroups'
import EnvironmentGroupDetails from './components/EnvironmentGroups/EnvironmentGroupDetails/EnvironmentGroupDetails'

import CDTrialHomePage from './pages/home/CDTrialHomePage'

import { CDExecutionCardSummary } from './components/CDExecutionCardSummary/CDExecutionCardSummary'
import { CDExecutionSummary } from './components/CDExecutionSummary/CDExecutionSummary'
import { CDStageDetails } from './components/CDStageDetails/CDStageDetails'

import GitOpsServersPage from './pages/gitops/GitOpsServersHomePage'
import GitOpsModalContainer from './pages/gitops/NativeArgo/GitOpsProvidersList'
import artifactSourceBaseFactory from './factory/ArtifactSourceFactory/ArtifactSourceBaseFactory'
import { KubernetesArtifacts } from './components/PipelineSteps/K8sServiceSpec/KubernetesArtifacts/KubernetesArtifacts'
import { KubernetesManifests } from './components/PipelineSteps/K8sServiceSpec/KubernetesManifests/KubernetesManifests'
import manifestSourceBaseFactory from './factory/ManifestSourceFactory/ManifestSourceBaseFactory'
import {
  DeployEnvironmentWidget,
  NewEditEnvironmentModal
} from './components/PipelineSteps/DeployEnvStep/DeployEnvStep'
import type { GitOpsCustomMicroFrontendProps } from './interfaces/GitOps.types'
import { getBannerText } from './utils/renderMessageUtils'
import ServiceStudio from './components/Services/ServiceStudio/ServiceStudio'
import { DeployServiceWidget } from './components/PipelineSteps/DeployServiceStep/DeployServiceWidget'
import { NewEditServiceModal } from './components/PipelineSteps/DeployServiceStep/NewEditServiceModal'

// eslint-disable-next-line import/no-unresolved
const GitOpsServersList = React.lazy(() => import('gitopsui/MicroFrontendApp'))

RbacFactory.registerResourceCategory(ResourceCategory.GITOPS, {
  icon: 'gitops-agent',
  label: 'cd.gitOps'
})

RbacFactory.registerResourceTypeHandler(ResourceType.GITOPS_AGENT, {
  icon: 'gitops-agent',
  label: 'common.agents',
  category: ResourceCategory.GITOPS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_GITOPS_AGENT]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_GITOPS_AGENT]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_GITOPS_AGENT]: <LocaleString stringID="delete" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.GITOPS_APP, {
  icon: 'gitops-agent',
  label: 'applications',
  category: ResourceCategory.GITOPS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_GITOPS_APPLICATION]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_GITOPS_APPLICATION]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_GITOPS_APPLICATION]: <LocaleString stringID="delete" />,
    [PermissionIdentifier.SYNC_GITOPS_APPLICATION]: <LocaleString stringID="common.sync" />,
    [PermissionIdentifier.OVERRIDE_GITOPS_APPLICATION]: <LocaleString stringID="override" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.GITOPS_CERT, {
  icon: 'gitops-agent',
  label: 'common.repositoryCertificates',
  category: ResourceCategory.GITOPS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_GITOPS_CERT]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_GITOPS_CERT]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_GITOPS_CERT]: <LocaleString stringID="delete" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.GITOPS_CLUSTER, {
  icon: 'gitops-agent',
  label: 'common.clusters',
  category: ResourceCategory.GITOPS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_GITOPS_CLUSTER]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_GITOPS_CLUSTER]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_GITOPS_CLUSTER]: <LocaleString stringID="delete" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.GITOPS_GPGKEY, {
  icon: 'gitops-agent',
  label: 'common.gnupgKeys',
  category: ResourceCategory.GITOPS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_GITOPS_GPGKEY]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_GITOPS_GPGKEY]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_GITOPS_GPGKEY]: <LocaleString stringID="delete" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.GITOPS_REPOSITORY, {
  icon: 'gitops-agent',
  label: 'repositories',
  category: ResourceCategory.GITOPS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_GITOPS_REPOSITORY]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_GITOPS_REPOSITORY]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_GITOPS_REPOSITORY]: <LocaleString stringID="delete" />
  }
})

executionFactory.registerCardInfo(StageType.DEPLOY, {
  icon: 'cd-main',
  component: CDExecutionCardSummary
})

executionFactory.registerSummary(StageType.DEPLOY, {
  component: CDExecutionSummary
})

executionFactory.registerStageDetails(StageType.DEPLOY, {
  component: CDStageDetails
})

featureFactory.registerFeaturesByModule('cd', {
  features: [
    FeatureIdentifier.DEPLOYMENTS_PER_MONTH,
    FeatureIdentifier.SERVICES,
    FeatureIdentifier.INITIAL_DEPLOYMENTS
  ],
  renderMessage: (props, getString, additionalLicenseProps = {}): RenderMessageReturn => {
    const featuresMap = props.features
    const serviceFeatureDetail = featuresMap.get(FeatureIdentifier.SERVICES)
    const dpmFeatureDetail = featuresMap.get(FeatureIdentifier.DEPLOYMENTS_PER_MONTH)
    const initialDeploymentsFeatureDetail = featuresMap.get(FeatureIdentifier.INITIAL_DEPLOYMENTS)

    return getBannerText(
      getString,
      additionalLicenseProps,
      serviceFeatureDetail,
      dpmFeatureDetail,
      initialDeploymentsFeatureDetail
    )
  }
})

const RedirectToAccessControlHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()

  return <Redirect to={routes.toUsers({ accountId, projectIdentifier, orgIdentifier, module })} />
}

const RedirectToGitSyncHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } =
    useParams<PipelineType<ProjectPathProps & ModulePathParams>>()

  return <Redirect to={routes.toGitSyncReposAdmin({ projectIdentifier, accountId, orgIdentifier, module })} />
}

const RedirectToDelegatesHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()

  return <Redirect to={routes.toDelegateList({ accountId, projectIdentifier, orgIdentifier, module })} />
}

const RedirectToCDProject = (): React.ReactElement => {
  const { accountId } = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()
  if (selectedProject?.modules?.includes(ModuleName.CD)) {
    return (
      <Redirect
        to={routes.toProjectOverview({
          accountId,
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier,
          module: 'cd'
        })}
      />
    )
  } else {
    return <Redirect to={routes.toCDHome({ accountId })} />
  }
}

const CDDashboardPageOrRedirect = (): React.ReactElement => {
  const params = useParams<ProjectPathProps & ModuleListCardProps>()
  const { module } = params
  const { selectedProject } = useAppStore()
  const isCommunity = isCommunityPlan()

  if (!isCommunity) {
    return <CDDashboardPage />
  } else if (
    selectedProject?.modules?.includes(ModuleName.CD) ||
    (module && module.toUpperCase() === ModuleName.CD.toUpperCase())
  ) {
    return <Redirect to={routes.toDeployments({ ...params, module: 'cd' })} />
  } else {
    return <Redirect to={routes.toCDHome(params)} />
  }
}

const RedirectToPipelineDetailHome = (): React.ReactElement => {
  const params = useParams<PipelineType<PipelinePathProps>>()

  return <Redirect to={routes.toPipelineStudio(params)} />
}

const RedirectToExecutionPipeline = (): React.ReactElement => {
  const params = useParams<PipelineType<ExecutionPathProps>>()

  return <Redirect to={routes.toExecutionPipelineView(params)} />
}

const RedirectToModuleTrialHome = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  const { source } = useQueryParams<{ source?: string }>()

  return (
    <Redirect
      to={routes.toModuleTrialHome({
        accountId,
        module: 'cd',
        source
      })}
    />
  )
}

const GitOpsPage = (): React.ReactElement | null => {
  const { ARGO_PHASE1, ARGO_PHASE2_MANAGED } = useFeatureFlags()

  if (ARGO_PHASE2_MANAGED) {
    return (
      <ChildAppMounter<GitOpsCustomMicroFrontendProps>
        ChildApp={GitOpsServersList}
        customComponents={{
          DeployEnvironmentWidget,
          DeployServiceWidget,
          NewEditEnvironmentModal,
          NewEditServiceModal
        }}
      />
    )
  }

  if (ARGO_PHASE1) {
    return (
      <GitOpsServersPage>
        <GitOpsModalContainer />
      </GitOpsServersPage>
    )
  }

  return null
}

const RedirectToSubscriptions = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={routes.toSubscriptions({
        accountId,
        moduleCard: ModuleName.CD.toLowerCase() as Module
      })}
    />
  )
}

const EnvironmentsPage = (): React.ReactElement | null => {
  const { NG_SVC_ENV_REDESIGN } = useFeatureFlags()

  if (NG_SVC_ENV_REDESIGN) {
    return <EnvironmentsV2 />
  } else {
    return <Environments />
  }
}

const licenseRedirectData: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.CD_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHome,
  expiredTrialRedirect: RedirectToSubscriptions
}

const CDSideNavProps: SidebarContext = {
  navComponent: CDSideNav,
  subtitle: 'Continuous',
  title: 'Delivery',
  icon: 'cd-main'
}

const pipelineModuleParams: ModulePathParams = {
  module: ':module(cd)'
}

const templateModuleParams: ModulePathParams = {
  module: ':module(cd)'
}

TriggerFactory.registerTriggerForm(TriggerFormType.Manifest, {
  component: KubernetesManifests,
  baseFactory: manifestSourceBaseFactory
})

TriggerFactory.registerTriggerForm(TriggerFormType.Artifact, {
  component: KubernetesArtifacts,
  baseFactory: artifactSourceBaseFactory
})

export default (
  <>
    <Route licenseRedirectData={licenseRedirectData} path={routes.toCD({ ...accountPathProps })} exact>
      <RedirectToCDProject />
    </Route>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toCDHome({ ...accountPathProps })}
      exact
      pageName={PAGE_NAME.CDHomePage}
    >
      <CDHomePage />
    </RouteWithLayout>
    <RouteWithLayout
      layout={MinimalLayout}
      path={routes.toModuleTrialHome({ ...accountPathProps, module: 'cd' })}
      exact
      pageName={PAGE_NAME.CDTrialHomePage}
    >
      <CDTrialHomePage />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toProjectOverview({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      exact
    >
      <CDDashboardPageOrRedirect />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toDeployments({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      exact
      pageName={PAGE_NAME.DeploymentsList}
    >
      <DeploymentsList />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toPipelines({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.PipelinesPage}
    >
      <PipelinesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toServices({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.Services}
    >
      <Services />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toServiceStudio({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams,
        ...servicePathProps
      })}
      pageName={PAGE_NAME.ServiceStudio}
    >
      <ServiceStudio />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toEnvironment({ ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.Environments}
    >
      <EnvironmentsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toEnvironmentDetails({ ...projectPathProps, ...pipelineModuleParams, ...environmentPathProps })}
      pageName={PAGE_NAME.Environments}
    >
      <EnvironmentDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toEnvironmentGroups({ ...projectPathProps, ...pipelineModuleParams })}
    >
      <EnvironmentGroups />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toEnvironmentGroupDetails({
        ...projectPathProps,
        ...pipelineModuleParams,
        ...environmentGroupPathProps
      })}
    >
      <EnvironmentGroupDetails />
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      exact
      path={routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.CDPipelineStudio}
    >
      <PipelineDetails>
        <CDPipelineStudio />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      layout={EmptyLayout}
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toPipelineLogs({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams,
        stageIdentifier: ':stageIdentifier',
        stepIndentifier: ':stepIndentifier'
      })}
      pageName={PAGE_NAME.FullPageLogView}
    >
      <FullPageLogView />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      exact
      path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...templateModuleParams })}
      pageName={PAGE_NAME.TemplateStudioWrapper}
    >
      <TemplateStudioWrapper />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toPipelineDeploymentList({
        ...accountPathProps,
        ...pipelinePathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.CDPipelineDeploymentList}
    >
      <PipelineDetails>
        <CDPipelineDeploymentList />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toConnectors({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.ConnectorsPage}
    >
      <ConnectorsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.CreateConnectorFromYamlPage}
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...orgPathProps })}
      pageName={PAGE_NAME.CreateConnectorFromYamlPage}
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toSecrets({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.SecretsPage}
    >
      <SecretsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toVariables({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
    >
      <VariablesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toConnectorDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...connectorPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ConnectorDetailsPage}
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toSecretDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...pipelineModuleParams
      })}
    >
      <RedirectToSecretDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toSecretDetailsOverview({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.SecretDetails}
    >
      <SecretDetailsHomePage>
        <SecretDetails />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toSecretDetailsReferences({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.SecretReferences}
    >
      <SecretDetailsHomePage>
        <SecretReferences />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toDelegates({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams
      })}
    >
      <RedirectToDelegatesHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toDelegateList({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.DelegateListing}
    >
      <DelegatesPage>
        <DelegateListing />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toDelegateConfigs({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.DelegateConfigurations}
    >
      <DelegatesPage>
        <DelegateConfigurations />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toDelegatesDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...delegatePathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.DelegateDetails}
    >
      <DelegateDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[
        routes.toDelegateConfigsDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegateConfigProps,
          ...pipelineModuleParams
        }),
        routes.toEditDelegateConfigsDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegateConfigProps,
          ...pipelineModuleParams
        })
      ]}
      pageName={PAGE_NAME.DelegateProfileDetails}
    >
      <DelegateProfileDetails />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[
        routes.toDelegateTokens({
          ...accountPathProps,
          ...projectPathProps,
          ...pipelineModuleParams
        })
      ]}
      pageName={PAGE_NAME.DelegateTokens}
    >
      <DelegatesPage>
        <DelegateTokens />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toCreateSecretFromYaml({
        ...accountPathProps,
        ...projectPathProps,
        ...orgPathProps,
        ...pipelineModuleParams
      })}
      exact
      pageName={PAGE_NAME.CreateSecretFromYamlPage}
    >
      <CreateSecretFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toInputSetList({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.InputSetList}
    >
      <PipelineDetails>
        <InputSetList />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toInputSetForm({ ...accountPathProps, ...inputSetFormPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.EnhancedInputSetForm}
    >
      <EnhancedInputSetForm />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toTriggersPage({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TriggersPage}
    >
      <PipelineDetails>
        <TriggersPage />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toTriggersWizardPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TriggersWizardPage}
    >
      <TriggerDetails wizard={true}>
        <TriggersWizardPage />
      </TriggerDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toTriggersDetailPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TriggersDetailPage}
    >
      <TriggersDetailPage />
    </RouteWithLayout>
    <Route
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toExecution({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
    >
      <RedirectToExecutionPipeline />
    </Route>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionPipelineView({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.ExecutionPipelineView}
    >
      <ExecutionLandingPage>
        <ExecutionPipelineView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionPolicyEvaluationsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ExecutionPolicyEvaluationsView}
    >
      <ExecutionLandingPage>
        <ExecutionPolicyEvaluationsView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionSecurityView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ExecutionSecurityView}
    >
      <ExecutionLandingPage>
        <ExecutionSecurityView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionInputsView({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.ExecutionInputsView}
    >
      <ExecutionLandingPage>
        <ExecutionInputsView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionTestsView({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.BuildTests}
    >
      <ExecutionLandingPage>
        <BuildTests />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionArtifactsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ExecutionArtifactsView}
    >
      <ExecutionLandingPage>
        <ExecutionArtifactsView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toPipelineDetail({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
    >
      <RedirectToPipelineDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[routes.toAccessControl({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
    >
      <RedirectToAccessControlHome />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[routes.toUsers({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
      pageName={PAGE_NAME.UsersPage}
    >
      <AccessControlPage>
        <UsersPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toUserDetails({ ...projectPathProps, ...pipelineModuleParams, ...userPathProps })}
      exact
      pageName={PAGE_NAME.UserDetails}
    >
      <UserDetails />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[routes.toUserGroups({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
      pageName={PAGE_NAME.UserGroups}
    >
      <AccessControlPage>
        <UserGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toUserGroupDetails({ ...projectPathProps, ...pipelineModuleParams, ...userGroupPathProps })}
      exact
      pageName={PAGE_NAME.UserGroupDetails}
    >
      <UserGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={CDSideNavProps}
      path={routes.toServiceAccounts({ ...projectPathProps, ...pipelineModuleParams })}
      exact
      pageName={PAGE_NAME.ServiceAccountsPage}
    >
      <AccessControlPage>
        <ServiceAccountsPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toServiceAccountDetails({ ...projectPathProps, ...pipelineModuleParams, ...serviceAccountProps })}
      exact
      pageName={PAGE_NAME.ServiceAccountDetails}
    >
      <ServiceAccountDetails />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[routes.toResourceGroups({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
      pageName={PAGE_NAME.ResourceGroups}
    >
      <AccessControlPage>
        <ResourceGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[routes.toRoles({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
      pageName={PAGE_NAME.Roles}
    >
      <AccessControlPage>
        <Roles />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[routes.toRoleDetails({ ...projectPathProps, ...pipelineModuleParams, ...rolePathProps })]}
      exact
      pageName={PAGE_NAME.RoleDetails}
    >
      <RoleDetails />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={[
        routes.toResourceGroupDetails({ ...projectPathProps, ...pipelineModuleParams, ...resourceGroupPathProps })
      ]}
      exact
      pageName={PAGE_NAME.ResourceGroupDetails}
    >
      <ResourceGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      exact
      path={[routes.toGitSyncAdmin({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })]}
    >
      <RedirectToGitSyncHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toGitSyncReposAdmin({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncRepoTab}
    >
      <GitSyncPage>
        <GitSyncRepoTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toGitSyncEntitiesAdmin({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      exact
      pageName={PAGE_NAME.GitSyncEntityTab}
    >
      <GitSyncPage>
        <GitSyncEntityTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toGitSyncErrors({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      exact
      pageName={PAGE_NAME.GitSyncErrors}
    >
      <GitSyncPage>
        <GitSyncErrors />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toGitSyncConfig({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      exact
      pageName={PAGE_NAME.GitSyncConfigTab}
    >
      <GitSyncPage>
        <GitSyncConfigTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CDSideNavProps}
      path={routes.toTemplates({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TemplatesPage}
    >
      <TemplatesPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CDSideNavProps}
      path={[routes.toGitOps({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })]}
      pageName={PAGE_NAME.GitOpsPage}
    >
      <GitOpsPage />
    </RouteWithLayout>

    {GovernanceRouteDestinations({
      sidebarProps: CDSideNavProps,
      pathProps: { ...accountPathProps, ...projectPathProps, ...pipelineModuleParams }
    })}
  </>
)
