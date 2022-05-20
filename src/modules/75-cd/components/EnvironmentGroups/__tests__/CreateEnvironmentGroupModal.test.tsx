/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import * as cdNgServices from 'services/cd-ng'

import routes from '@common/RouteDefinitions'
import { modulePathProps, projectPathProps } from '@common/utils/routeUtils'
import { TestWrapper } from '@common/utils/testUtils'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import * as infiniteScrollHook from '@common/hooks/useInfiniteScroll'

import CreateEnvironmentGroupModal from '../CreateEnvironmentGroupModal'

import environmentListData from './__mocks__/environmentListData.json'
import yamlSchema from './__mocks__/yamlSchema.json'

const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

describe('Create Environment Group Modal', () => {
  beforeEach(() => {
    jest.spyOn(cdNgServices, 'getEnvironmentListPromise').mockResolvedValue(environmentListData as any)
    jest.spyOn(cdNgServices, 'useGetYamlSchema').mockImplementation(() => ({ data: yamlSchema, loading: false } as any))

    jest.spyOn(infiniteScrollHook, 'useInfiniteScroll').mockReturnValue({
      items: environmentListData.data.content,
      error: '',
      fetching: false,
      attachRefToLastElement: jest.fn(),
      hasMore: { current: false },
      loadItems: jest.fn(),
      offsetToFetch: { current: 0 }
    })
  })

  test('creates environment group successfully', async () => {
    jest.spyOn(cdNgServices, 'createEnvironmentGroupPromise').mockResolvedValue({
      status: 'SUCCESS',
      data: {
        envGroup: {
          identifier: 'test'
        }
      }
    })

    const { container } = render(
      <TestWrapper
        path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <CreateEnvironmentGroupModal closeModal={jest.fn()} />
      </TestWrapper>
    )

    await waitFor(() => expect(screen.queryByText('Environment 1')).toBeInTheDocument())

    const nameField = container.querySelector('[name="name"]')
    if (!nameField) {
      throw Error('cannot find name field')
    }
    fireEvent.change(nameField, { target: { value: 'Env Group 1 ' } })

    const environmentCheckboxes = container.querySelectorAll('input[name="environments"]')

    fireEvent.click(environmentCheckboxes[0])
    fireEvent.click(environmentCheckboxes[4])
    fireEvent.click(environmentCheckboxes[0])

    const submitButton = screen.getByText('submit')
    fireEvent.click(submitButton!)

    await waitFor(() =>
      expect(cdNgServices.createEnvironmentGroupPromise).toHaveBeenCalledWith({
        body: {
          identifier: 'Env_Group_1',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          yaml: 'environmentGroup:\n  name: Env Group 1\n  identifier: Env_Group_1\n  description: ""\n  tags: {}\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_1\n'
        },
        queryParams: {
          accountIdentifier: 'dummy'
        },
        requestOptions: {
          headers: {
            'Content-Type': 'application/yaml'
          }
        }
      })
    )
  })

  test('failes to create environment group', async () => {
    jest.spyOn(cdNgServices, 'createEnvironmentGroupPromise').mockRejectedValue({
      status: 'FAILURE',
      data: {
        message: 'Failed to create environment group'
      } as any
    })

    const { container } = render(
      <TestWrapper
        path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <CreateEnvironmentGroupModal closeModal={jest.fn()} />
      </TestWrapper>
    )

    await waitFor(() => expect(screen.queryByText('Environment 1')).toBeInTheDocument())

    const nameField = container.querySelector('[name="name"]')
    if (!nameField) {
      throw Error('cannot find name field')
    }
    fireEvent.change(nameField, { target: { value: 'Env Group 1 ' } })

    const submitButton = screen.getByText('submit')
    fireEvent.click(submitButton!)

    await waitFor(() =>
      expect(cdNgServices.createEnvironmentGroupPromise).toHaveBeenCalledWith({
        body: {
          identifier: 'Env_Group_1',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          yaml: 'environmentGroup:\n  name: Env Group 1\n  identifier: Env_Group_1\n  description: ""\n  tags: {}\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_1\n'
        },
        queryParams: {
          accountIdentifier: 'dummy'
        },
        requestOptions: {
          headers: {
            'Content-Type': 'application/yaml'
          }
        }
      })
    )

    await waitFor(() => expect(screen.getByText('Failed to create environment group')).toBeInTheDocument())
  })

  test('toggles between yaml and visual', async () => {
    jest.mock('@common/components/YAMLBuilder/YamlBuilder', () => ({
      YAMLBuilder: ({ children, bind }: { children: JSX.Element; bind: YamlBuilderProps['bind'] }) => {
        const handler = React.useMemo(
          () =>
            ({
              getLatestYaml: () =>
                'environmentGroup:\n  name: Env Group 1\n  identifier: Env_Group_1\n  description: ""\n  tags: {}\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_1\n',
              getYAMLValidationErrorMap: () => new Map()
            } as YamlBuilderHandlerBinding),
          []
        )

        React.useEffect(() => {
          bind?.(handler)
        }, [bind, handler])
        return (
          <div>
            <span>Yaml View</span>
            {children}
          </div>
        )
      }
    }))

    render(
      <TestWrapper
        path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <CreateEnvironmentGroupModal closeModal={jest.fn()} />
      </TestWrapper>
    )

    const visualToggle = screen.queryByText('VISUAL')
    const yamlToggle = screen.queryByText('YAML')

    yamlToggle?.click()
    visualToggle?.click()

    await waitFor(() => expect(visualToggle).toHaveClass('PillToggle--selected'))
  })
})
