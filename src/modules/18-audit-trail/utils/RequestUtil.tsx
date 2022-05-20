/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption } from '@wings-software/uicore'
import uniqBy from 'lodash/uniqBy'
import type { IconProps } from '@harness/icons'
import type { AuditTrailFormType, ProjectSelectOption } from '@audit-trail/components/FilterDrawer/FilterDrawer'
import type { AuditEventDTO, AuditFilterProperties, ResourceScopeDTO } from 'services/audit'
import type { StringKeys } from 'framework/strings'
import type { OrganizationAggregateDTO, ProjectResponse } from 'services/cd-ng'
import type { Module } from '@common/interfaces/RouteInterfaces'
import AuditTrailFactory from '@audit-trail/factories/AuditTrailFactory'

export const actionToLabelMap: Record<AuditEventDTO['action'], StringKeys> = {
  CREATE: 'created',
  UPDATE: 'auditTrail.actions.updated',
  RESTORE: 'auditTrail.actions.restored',
  DELETE: 'deleted',
  UPSERT: 'auditTrail.actions.updated',
  INVITE: 'auditTrail.actions.invited',
  RESEND_INVITE: 'auditTrail.actions.invite_resent',
  REVOKE_INVITE: 'auditTrail.actions.invite_revoked',
  ADD_COLLABORATOR: 'auditTrail.actions.added_collaborator',
  REMOVE_COLLABORATOR: 'auditTrail.actions.removed_collaborator',
  ADD_MEMBERSHIP: 'auditTrail.actions.added_membership',
  REMOVE_MEMBERSHIP: 'auditTrail.actions.removed_membership',
  CREATE_TOKEN: 'auditTrail.actions.create_token',
  REVOKE_TOKEN: 'auditTrail.actions.revoke_token',
  LOGIN: 'auditTrail.actions.login',
  LOGIN2FA: 'auditTrail.actions.login2fa',
  UNSUCCESSFUL_LOGIN: 'auditTrail.actions.unsuccessfullLogin'
}

export const moduleToLabelMap: Record<AuditEventDTO['module'], StringKeys> = {
  CD: 'common.module.cd',
  CE: 'common.module.ce',
  CF: 'common.module.cf',
  CV: 'common.module.cv',
  CI: 'common.module.ci',
  CORE: 'common.module.core',
  PMS: 'common.module.pms',
  TEMPLATESERVICE: 'common.module.templateService',
  STO: 'common.module.sto',
  GOVERNANCE: 'common.module.governance'
}

export const getModuleNameFromAuditModule = (auditModule: AuditEventDTO['module']): Module | undefined => {
  switch (auditModule) {
    case 'CD':
      return 'cd'
    case 'CI':
      return 'ci'
    case 'CF':
      return 'cf'
    case 'CE':
      return 'ce'
    case 'CV':
      return 'cv'
  }
  return undefined
}

interface ModuleInfo {
  moduleLabel: StringKeys
  icon: IconProps
}

export const moduleInfoMap: Record<AuditEventDTO['module'], ModuleInfo> = {
  CD: {
    moduleLabel: 'common.purpose.cd.continuous',
    icon: { name: 'cd' }
  },
  CI: {
    moduleLabel: 'common.purpose.ci.continuous',
    icon: { name: 'ci-main' }
  },
  CF: {
    moduleLabel: 'common.purpose.cf.continuous',
    icon: { name: 'cf-main' }
  },
  CE: {
    moduleLabel: 'cloudCostsText',
    icon: { name: 'ce-main' }
  },
  CV: {
    moduleLabel: 'common.purpose.cv.serviceReliability',
    icon: { name: 'cv-main' }
  },
  PMS: {
    moduleLabel: 'common.pipeline',
    icon: { name: 'pipeline' }
  },
  CORE: {
    moduleLabel: 'auditTrail.Platform',
    icon: { name: 'nav-settings' }
  },
  TEMPLATESERVICE: {
    moduleLabel: 'common.module.templateService',
    icon: { name: 'nav-settings' }
  },
  STO: {
    moduleLabel: 'common.module.sto',
    icon: { name: 'nav-settings' }
  },
  GOVERNANCE: {
    moduleLabel: 'common.module.governance',
    icon: { name: 'nav-settings' }
  }
}

export type ShowEventFilterType = Exclude<AuditFilterProperties['staticFilter'], undefined>

export const showEventTypeMap: Record<ShowEventFilterType, StringKeys> = {
  EXCLUDE_LOGIN_EVENTS: 'auditTrail.excludeLoginEvents',
  EXCLUDE_SYSTEM_EVENTS: 'auditTrail.excludeSystemEvents'
}

export const getFilterPropertiesFromForm = (formData: AuditTrailFormType, accountId: string): AuditFilterProperties => {
  const filterProperties: AuditFilterProperties = { filterType: 'Audit' }
  const { actions, modules, users, resourceType, organizations, projects } = formData
  if (actions) {
    filterProperties['actions'] = actions.map(action => action.value) as AuditFilterProperties['actions']
  }
  if (modules) {
    filterProperties['modules'] = modules.map(
      (module: MultiSelectOption) => module.value
    ) as AuditFilterProperties['modules']
  }

  if (users) {
    filterProperties['principals'] = users.map(user => ({
      type: 'USER',
      identifier: user.value
    })) as AuditFilterProperties['principals']
  }

  if (resourceType) {
    filterProperties['resources'] = resourceType.map(type => ({
      type: type.value
    })) as AuditFilterProperties['resources']
  }

  if (projects && projects.length > 0) {
    filterProperties['scopes'] = projects.map(projectData => ({
      projectIdentifier: projectData.value as string,
      accountIdentifier: accountId,
      orgIdentifier: projectData.orgIdentifier
    }))
  }

  if (organizations) {
    if (!filterProperties['scopes']) {
      filterProperties['scopes'] = organizations.map(org => ({
        accountIdentifier: accountId,
        orgIdentifier: org.value as string
      }))
    } else {
      organizations.forEach(org => {
        if (filterProperties['scopes']?.findIndex(scope => scope.orgIdentifier === org.value) === -1) {
          filterProperties['scopes'].push({
            accountIdentifier: accountId,
            orgIdentifier: org.value as string
          })
        }
      })
    }
  }

  return filterProperties
}

const getOrgAndProjects = (scopes: ResourceScopeDTO[]) => {
  const organizations: MultiSelectOption[] = []
  const projects: ProjectSelectOption[] = []
  scopes.forEach(scope => {
    if (scope.orgIdentifier) {
      if (scope.projectIdentifier) {
        projects.push({
          label: scope.projectIdentifier,
          value: scope.projectIdentifier,
          orgIdentifier: scope.orgIdentifier
        })
      }
      organizations.push({ label: scope.orgIdentifier, value: scope.orgIdentifier })
    }
  })
  return {
    organizations: uniqBy(organizations, org => org.value),
    projects
  }
}

export const getFormValuesFromFilterProperties = (
  filterProperties: AuditFilterProperties,
  getString: (key: StringKeys, vars?: Record<string, any>) => string
): AuditTrailFormType => {
  const formData: AuditTrailFormType = {}
  const { actions, modules, principals, scopes, resources } = filterProperties
  if (actions) {
    formData['actions'] = actions?.map(action => ({ label: getString(actionToLabelMap[action]), value: action }))
  }

  if (modules) {
    formData['modules'] = modules?.map(module => ({ label: getString(moduleToLabelMap[module]), value: module }))
  }

  if (principals) {
    formData['users'] = principals?.map(principal => ({
      label: principal.identifier,
      value: principal.identifier
    }))
  }

  if (resources) {
    formData['resourceType'] = resources?.map(resource => {
      const label = AuditTrailFactory.getResourceHandler(resource.type)?.resourceLabel
      return {
        label: label ? getString(label) : resource.type,
        value: resource.type
      }
    })
  }

  return {
    ...formData,
    ...(scopes ? getOrgAndProjects(scopes) : {})
  }
}

export const formToLabelMap = (obj: Record<string, any>) => {
  const labelMap: {
    [key: string]: any
  } = {}
  Object.keys(obj).forEach((key: string) => {
    labelMap[key] = Array.isArray(obj[key]) ? obj[key].map((value: MultiSelectOption) => value.value) : obj[key]
  })
  return labelMap
}

export const getProjectDropdownList = (list: ProjectResponse[]): ProjectSelectOption[] => {
  return list.map(project => ({
    label: project.project.name,
    value: project.project.identifier,
    orgIdentifier: project.project.orgIdentifier as string
  }))
}

export const getOrgDropdownList = (list: OrganizationAggregateDTO[]): MultiSelectOption[] => {
  return list.map(org => ({
    label: org.organizationResponse.organization.name,
    value: org.organizationResponse.organization.identifier
  }))
}

const SEPARATOR = '|'
export const getStringFromSubtitleMap = (map: Record<string, string | undefined>): string => {
  const keysArr = Object.keys(map)
  const arr: string[] = keysArr.reduce((finalArr: string[], key: string) => {
    return map[key] ? [...finalArr, `${key}: ${map[key]}`] : finalArr
  }, [])
  return arr.reduce((str, text) => `${str} ${SEPARATOR} ${text}`)
}
