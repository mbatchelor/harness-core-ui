/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { HomePageTemplate } from '@projects-orgs/pages/HomePageTemplate/HomePageTemplate'
import { useStrings } from 'framework/strings'
import type { Project } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import bgImageURL from './images/chaos.svg'

// ChaosHomePage: Renders home page when no project is selected
export default function ChaosHomePage(): React.ReactElement {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()

  // projectCreateSuccessHandler: redirects to the project dashboard upon selection from new project modal
  const projectCreateSuccessHandler = (project?: Project): void => {
    if (project) {
      history.push(
        routes.toProjectOverview({
          projectIdentifier: project.identifier,
          orgIdentifier: project.orgIdentifier || '',
          accountId,
          module: 'chaos'
        })
      )
    }
  }

  return (
    <HomePageTemplate
      title={getString('chaos.homepage.chaosHomePageTitle')}
      bgImageUrl={bgImageURL}
      projectCreateSuccessHandler={projectCreateSuccessHandler}
      subTitle={getString('chaos.homepage.slogan')}
      documentText={getString('chaos.homepage.learnMore')}
    />
  )
}
