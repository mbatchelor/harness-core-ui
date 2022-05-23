/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { Project } from 'services/cd-ng'
import ChaosHomePage from '../ChaosHomePage'

const project: Project = {
  orgIdentifier: undefined,
  identifier: 'testID',
  name: 'testProject',
  description: 'test'
}

let projectExists = true

jest.mock('@projects-orgs/pages/HomePageTemplate/HomePageTemplate', () => ({
  ...(jest.requireActual('@projects-orgs/pages/HomePageTemplate/HomePageTemplate') as any),
  HomePageTemplate: function MockComponent(props: any) {
    return (
      <div className="homepagetemplate">
        <button
          className="projectCreate"
          type="button"
          onClick={() => props.projectCreateSuccessHandler(projectExists ? project : undefined)}
        />
      </div>
    )
  }
}))

describe('Chaos Homepage Test', () => {
  test('should render ChaosHomePage with proper headings', () => {
    const { container } = render(
      <TestWrapper
        pathParams={{ accountId: 'dummyAccID', orgIdentifier: 'dummyOrgID', projectIdentifier: 'dummyProjID' }}
      >
        <ChaosHomePage />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Ensure project success handler calls history push', () => {
    projectExists = true
    const { container } = render(
      <TestWrapper
        pathParams={{ accountId: 'dummyAccID', orgIdentifier: 'dummyOrgID', projectIdentifier: 'dummyProjID' }}
      >
        <ChaosHomePage />
      </TestWrapper>
    )
    const projectCreateButton = container.querySelector('[class~="projectCreate"]')
    if (projectCreateButton) fireEvent.click(projectCreateButton)
    expect(container).toMatchSnapshot()
  })

  test('Ensure project success handler does not redirect when project is empty', () => {
    projectExists = false
    const { container } = render(
      <TestWrapper
        pathParams={{ accountId: 'dummyAccID', orgIdentifier: 'dummyOrgID', projectIdentifier: 'dummyProjID' }}
      >
        <ChaosHomePage />
      </TestWrapper>
    )
    const projectCreateButton = container.querySelector('[class~="projectCreate"]')
    if (projectCreateButton) fireEvent.click(projectCreateButton)
    expect(container).toMatchSnapshot()
  })
})
