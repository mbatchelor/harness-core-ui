/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, PageSpinner, Tag } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { ResourceGroupDetailsPathProps, ModulePathParams } from '@common/interfaces/RouteInterfaces'
import type { ScopeSelector } from 'services/resourcegroups'
import { useGetProjectList } from 'services/cd-ng'
import { getAllProjects, includeProjects } from '../utils'
import css from './ResourceGroupScope.module.scss'

interface ProjectSelectionRendererProps {
  includedScopes: ScopeSelector[]
}

const ProjectSelectionRenderer: React.FC<ProjectSelectionRendererProps> = ({ includedScopes }) => {
  const { accountId, orgIdentifier } = useParams<ResourceGroupDetailsPathProps & ModulePathParams>()
  const hasProjects = includeProjects(includedScopes)
  const projects = getAllProjects(includedScopes)
  const { getString } = useStrings()

  const { data, loading } = useGetProjectList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      identifiers: projects
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    }
  })

  /* istanbul ignore else */ if (!hasProjects || !projects.length) {
    return <></>
  }
  return (
    <Layout.Horizontal spacing="xsmall" padding="xsmall" className={css.projectSelection}>
      {loading && /* istanbul ignore next */ <PageSpinner />}
      {data?.data?.content?.map(({ project }) => (
        <Tag key={project.identifier} className={css.projectTags}>{`${project.name} (${getString('idLabel', {
          id: project.identifier
        })})`}</Tag>
      ))}
    </Layout.Horizontal>
  )
}

export default ProjectSelectionRenderer
