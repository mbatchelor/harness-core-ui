/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import ChaosSideNav from '../ChaosSideNav'

jest.mock('@projects-orgs/components/ProjectSelector/ProjectSelector', () => ({
  ProjectSelector: function ProjectSelectorComp(props: any) {
    return (
      <button
        type="button"
        onClick={() => props.onSelect({ identifier: 'project', orgIdentifier: 'org' })}
        id="projectSelectorId"
      />
    )
  }
}))

describe('Chaos Sidenav Render', () => {
  test('render the chaos sidenav', () => {
    const { container } = render(
      <TestWrapper
        path={routes.toChaosMicroFrontend({
          accountId: ':accountId',
          orgIdentifier: ':orgIdentifier',
          projectIdentifier: ':projectIdentifier'
        })}
        pathParams={{ accountId: 'dummyAccID', orgIdentifier: 'dummyOrgID', projectIdentifier: 'dummyProjID' }}
      >
        <ChaosSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should go to chaos dashboard when project is selected', async () => {
    const { container, getByTestId } = render(
      <TestWrapper
        path={routes.toModuleHome({ accountId: ':accountId', module: ':module' })}
        pathParams={{ accountId: 'dummy', module: 'chaos' }}
      >
        <ChaosSideNav />
      </TestWrapper>
    )

    const projectButtonSel = '#projectSelectorId'
    const projectButton = await waitFor(() => container.querySelector(projectButtonSel))
    if (projectButton) fireEvent.click(projectButton)

    expect(getByTestId('location')).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/dummy/chaos/orgs/org/projects/project/dashboard
      </div>
    `)
  })

  test('should go to access control when selected from the sidebar', async () => {
    render(
      <TestWrapper
        path={routes.toChaosMicroFrontend({
          accountId: ':accountId',
          orgIdentifier: ':orgIdentifier',
          projectIdentifier: ':projectIdentifier'
        })}
        pathParams={{ accountId: 'dummyAccID', orgIdentifier: 'dummyOrgID', projectIdentifier: 'dummyProjID' }}
      >
        <ChaosSideNav />
      </TestWrapper>
    )

    fireEvent.mouseOver(screen.getByText('common.projectSetup'))
    await waitFor(() => screen.getByText('accessControl'))
    fireEvent.click(screen.getByText('accessControl'))
    expect(screen.getByTestId('location')).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/dummyAccID/chaos/orgs/dummyOrgID/projects/dummyProjID/setup/access-control
      </div>
    `)
  })
})
