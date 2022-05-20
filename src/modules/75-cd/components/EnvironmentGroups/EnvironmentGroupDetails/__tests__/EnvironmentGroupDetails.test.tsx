/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import * as cdNgServices from 'services/cd-ng'

import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { environmentGroupPathProps, modulePathProps, projectPathProps } from '@common/utils/routeUtils'
import * as infiniteScrollHook from '@common/hooks/useInfiniteScroll'

import EnvironmentGroupDetails from '../EnvironmentGroupDetails'

import environmentGroupData from './__mocks__/EnvironmentGroupData.json'
import yamlSchema from '../../__tests__/__mocks__/yamlSchema.json'
import environmentListData from '../../__tests__/__mocks__/environmentListData.json'

const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

describe('Environment Group Details Page', () => {
  beforeEach(() => {
    jest
      .spyOn(cdNgServices, 'useGetEnvironmentGroup')
      .mockImplementation(() => ({ data: environmentGroupData, loading: false } as any))
    jest.spyOn(cdNgServices, 'useGetYamlSchema').mockImplementation(() => ({ data: yamlSchema, loading: false } as any))
    jest.spyOn(cdNgServices, 'updateEnvironmentGroupPromise').mockImplementation(
      () =>
        ({
          loading: false,
          mutate: jest.fn().mockResolvedValue({
            status: 'SUCCESS',
            data: {
              envGroup: {
                identifier: 'test'
              }
            }
          }),
          refetch: jest.fn(),
          cancel: jest.fn()
        } as any)
    )
  })

  test('loads configuration and update of name and description', async () => {
    const { container } = render(
      <TestWrapper
        path={routes.toEnvironmentGroupDetails({
          ...projectPathProps,
          ...modulePathProps,
          ...environmentGroupPathProps
        })}
        pathParams={{
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          module: 'cd',
          environmentGroupIdentifier: 'Env_Group_7'
        }}
        queryParams={{ sectionId: 'CONFIGURATION' }}
      >
        <EnvironmentGroupDetails />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    const saveBtn = screen.queryByRole('button', { name: /save/ })
    expect(saveBtn).toBeInTheDocument()
    expect(saveBtn).toBeDisabled()

    await act(async () => {
      const nameField = container.querySelector('[name="name"]')
      if (!nameField) {
        throw Error('cannot find name field')
      }
      fireEvent.change(nameField, { target: { value: 'Env Group 1 ' } })
      fireEvent.change(nameField, { target: { value: 'Env Group 7' } })
      fireEvent.change(nameField, { target: { value: 'Env Group 1 ' } })

      const descriptionField = container.querySelector('[name="description"]')
      if (!descriptionField) {
        throw Error('cannot find description field')
      }
      fireEvent.change(descriptionField, { target: { value: 'Test Description ' } })

      await waitFor(() => expect(saveBtn).not.toBeDisabled())
      fireEvent.click(saveBtn!)
    })

    expect(cdNgServices.updateEnvironmentGroupPromise).toHaveBeenCalledWith({
      body: {
        identifier: 'Env_Group_7',
        orgIdentifier: 'dummy',
        projectIdentifier: 'dummy',
        yaml: 'environmentGroup:\n  name: "Env Group 1 "\n  identifier: Env_Group_7\n  description: "Test Description "\n  tags:\n    Tag 1: ""\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_Ash_3\n    - Env_Ash_1\n'
      },
      envGroupIdentifier: 'Env_Group_7',
      queryParams: {
        accountIdentifier: 'dummy'
      },
      requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
    })
  })

  test('toggles between yaml and visual in the configuration section', async () => {
    jest.mock('@common/components/YAMLBuilder/YamlBuilder', () => ({
      YAMLBuilder: ({ children, bind }: { children: JSX.Element; bind: YamlBuilderProps['bind'] }) => {
        const handler = React.useMemo(
          () =>
            ({
              getLatestYaml: () =>
                'environmentGroup:\n  name: "Env Group 1 "\n  identifier: Env_Group_7\n  description: "Test Description "\n  tags:\n    Tag 1: ""\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_Ash_3\n    - Env_Ash_1\n',
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
        path={routes.toEnvironmentGroupDetails({
          ...projectPathProps,
          ...modulePathProps,
          ...environmentGroupPathProps
        })}
        pathParams={{
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          module: 'cd',
          environmentGroupIdentifier: 'Env_Group_7'
        }}
        queryParams={{ sectionId: 'CONFIGURATION' }}
      >
        <EnvironmentGroupDetails />
      </TestWrapper>
    )

    const visualToggle = screen.queryByText('VISUAL')
    const yamlToggle = screen.queryByText('YAML')

    yamlToggle?.click()
    const saveBtn = screen.queryByRole('button', { name: /save/ })
    expect(saveBtn).toBeInTheDocument()
    expect(saveBtn).not.toBeDisabled()
    visualToggle?.click()

    await waitFor(() => expect(visualToggle).toHaveClass('PillToggle--selected'))
  })

  test('navigates to environment list and deletes environment', async () => {
    const { container } = render(
      <TestWrapper
        path={routes.toEnvironmentGroupDetails({
          ...projectPathProps,
          ...modulePathProps,
          ...environmentGroupPathProps
        })}
        pathParams={{
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          module: 'cd',
          environmentGroupIdentifier: 'Env_Group_7'
        }}
        queryParams={{ sectionId: 'CONFIGURATION' }}
      >
        <EnvironmentGroupDetails />
      </TestWrapper>
    )

    const environmentListTab = screen.queryByText('common.environmentList')
    fireEvent.click(environmentListTab!)

    const deleteButton = container.querySelector('[data-icon="main-trash"]')
    await waitFor(() => expect(deleteButton).toBeInTheDocument())

    const checkboxes = screen.queryAllByRole('checkbox')

    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    fireEvent.click(deleteButton!)

    expect(cdNgServices.updateEnvironmentGroupPromise).toHaveBeenCalledWith({
      body: {
        identifier: 'Env_Group_7',
        orgIdentifier: 'dummy',
        projectIdentifier: 'dummy',
        yaml: 'environmentGroup:\n  name: Env Group 7\n  identifier: Env_Group_7\n  description: Test\n  tags:\n    Tag 1: ""\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_Ash_3\n'
      },
      envGroupIdentifier: 'Env_Group_7',
      queryParams: {
        accountIdentifier: 'dummy'
      },
      requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
    })
  })

  test('toggles between yaml and visual in the environment section', async () => {
    jest.mock('@common/components/YAMLBuilder/YamlBuilder', () => ({
      YAMLBuilder: ({ children, bind }: { children: JSX.Element; bind: YamlBuilderProps['bind'] }) => {
        const handler = React.useMemo(
          () =>
            ({
              getLatestYaml: () =>
                'environmentGroup:\n  name: "Env Group 1 "\n  identifier: Env_Group_7\n  description: "Test Description "\n  tags:\n    Tag 1: ""\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_Ash_3\n    - Env_Ash_1\n',
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
        path={routes.toEnvironmentGroupDetails({
          ...projectPathProps,
          ...modulePathProps,
          ...environmentGroupPathProps
        })}
        pathParams={{
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          module: 'cd',
          environmentGroupIdentifier: 'Env_Group_7'
        }}
        queryParams={{ sectionId: 'ENVIRONMENTS' }}
      >
        <EnvironmentGroupDetails />
      </TestWrapper>
    )

    const visualToggle = screen.queryByText('VISUAL')
    const yamlToggle = screen.queryByText('YAML')

    yamlToggle?.click()
    const saveBtn = screen.queryByRole('button', { name: /save/ })
    expect(saveBtn).toBeInTheDocument()
    expect(saveBtn).not.toBeDisabled()
    visualToggle?.click()

    await waitFor(() => expect(visualToggle).toHaveClass('PillToggle--selected'))
  })

  test('update environment list from modal', async () => {
    jest.spyOn(cdNgServices, 'getEnvironmentListPromise').mockResolvedValue(environmentListData as any)
    jest.spyOn(infiniteScrollHook, 'useInfiniteScroll').mockReturnValue({
      items: environmentListData.data.content,
      error: '',
      fetching: false,
      attachRefToLastElement: jest.fn(),
      hasMore: { current: false },
      loadItems: jest.fn(),
      offsetToFetch: { current: 0 }
    })

    render(
      <TestWrapper
        path={routes.toEnvironmentGroupDetails({
          ...projectPathProps,
          ...modulePathProps,
          ...environmentGroupPathProps
        })}
        pathParams={{
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          module: 'cd',
          environmentGroupIdentifier: 'Env_Group_7'
        }}
        queryParams={{ sectionId: 'ENVIRONMENTS' }}
      >
        <EnvironmentGroupDetails />
      </TestWrapper>
    )

    const addEnvironmentButton = screen.queryByText('environment')
    fireEvent.click(addEnvironmentButton!)

    const dialog = findDialogContainer()

    if (!dialog) {
      throw Error('Dialog did not open')
    }
    await waitFor(() => expect(screen.queryByText('Environment 1')).toBeInTheDocument())

    const environmentCheckboxes = dialog.querySelectorAll('input[name="environments"]')

    fireEvent.click(environmentCheckboxes[0])
    fireEvent.click(environmentCheckboxes[2])

    const submitButton = screen.getByText('add')
    await waitFor(() => expect(environmentCheckboxes[0]).not.toBeChecked())
    await waitFor(() => expect(environmentCheckboxes[2]).toBeChecked())
    fireEvent.click(submitButton!)

    await waitFor(() =>
      expect(cdNgServices.updateEnvironmentGroupPromise).toHaveBeenLastCalledWith({
        body: {
          identifier: 'Env_Group_7',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy',
          yaml: 'environmentGroup:\n  name: Env Group 7\n  identifier: Env_Group_7\n  description: Test\n  tags:\n    Tag 1: ""\n  orgIdentifier: dummy\n  projectIdentifier: dummy\n  envIdentifiers:\n    - Environment_Ash_3\n    - Environment_Ash_2\n'
        },
        envGroupIdentifier: 'Env_Group_7',
        queryParams: {
          accountIdentifier: 'dummy'
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })
    )
  })
})
