/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, getByText, act, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { DeployService } from '../DeployServiceStep.stories'
import serviceData, { inputSetServiceData } from './serviceMock'
import { NewEditServiceModal } from '../NewEditServiceModal'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
const onSave = jest.fn()
const onClose = jest.fn()

const props = {
  isEdit: false,
  data: { name: 'demo', identifier: 'demo1', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' },
  isService: true,
  onCreateOrUpdate: onSave,
  closeModal: onClose
}

jest.mock('services/cd-ng', () => ({
  useGetServiceList: jest.fn().mockImplementation(() => ({ loading: false, data: serviceData, refetch: jest.fn() })),
  useGetServiceAccessList: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: inputSetServiceData, refetch: jest.fn() })),
  useGetYamlSchema: jest.fn(() => ({ data: null })),
  useCreateServicesV2: jest.fn().mockImplementation(() => ({
    cancel: jest.fn(),
    loading: false,
    mutate: jest.fn().mockImplementation(obj => {
      serviceData.data.content.push({
        service: {
          accountId: 'AQ8xhfNCRtGIUjq5bSM8Fg',
          identifier: obj[0].identifier,
          orgIdentifier: 'default',
          projectIdentifier: 'asdsaff',
          name: obj[0].name,
          description: null,
          deleted: false,
          tags: {},
          version: 9
        },
        createdAt: null,
        lastModifiedAt: null
      })
      return {
        status: 'SUCCESS'
      }
    })
  })),
  useUpsertServiceV2: jest.fn().mockImplementation(() => ({
    cancel: jest.fn(),
    loading: false,
    mutate: jest.fn().mockImplementation(() => {
      return {
        status: 'SUCCESS'
      }
    })
  }))
}))

describe('Test DeployService Step', () => {
  test('should render service view and save', async () => {
    const { container } = render(
      <DeployService type={StepType.DeployService} initialValues={{}} stepViewType={StepViewType.Edit} />
    )
    fireEvent.click(getByText(container, 'cd.pipelineSteps.serviceTab.plusNewService'))
    const dialog = findDialogContainer()
    expect(dialog).toMatchSnapshot()
    fillAtForm([
      {
        container: dialog!,
        fieldId: 'name',
        type: InputTypes.TEXTFIELD,
        value: 'New Service'
      }
    ])
    await act(async () => {
      fireEvent.click(getByText(dialog!, 'save'))
    })
    expect(container.querySelector('pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: New_Service
      "
    `)
  })
  test('should render edit service view (service ref), then update and then save', async () => {
    const { container } = render(
      <DeployService
        type={StepType.DeployService}
        initialValues={{ serviceRef: 'login4' }}
        stepViewType={StepViewType.Edit}
      />
    )
    fireEvent.click(getByText(container, 'editService'))
    const dialog = findDialogContainer()
    fillAtForm([
      {
        container: dialog!,
        fieldId: 'name',
        type: InputTypes.TEXTFIELD,
        value: 'Edit Service'
      }
    ])
    await act(async () => {
      fireEvent.click(getByText(dialog!, 'save'))
    })
    expect(container.querySelector('pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: login4
      "
    `)
  })
  test('should render edit service view (service), then update and then save', async () => {
    const { container } = render(
      <DeployService
        type={StepType.DeployService}
        initialValues={{
          service: {
            identifier: 'New_Service',
            name: 'New Service',
            description: 'test',
            tags: {
              tag1: '',
              tag2: 'asd'
            }
          }
        }}
        stepViewType={StepViewType.Edit}
      />
    )
    fireEvent.click(getByText(container, 'editService'))
    const dialog = findDialogContainer()
    expect(dialog).toMatchSnapshot()
    fillAtForm([
      {
        container: dialog!,
        fieldId: 'name',
        type: InputTypes.TEXTFIELD,
        value: 'Edit Service'
      }
    ])
    await act(async () => {
      fireEvent.click(getByText(dialog!, 'save'))
    })
    expect(container.querySelector('pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: New_Service
      "
    `)
  })

  test('Should be able save even if there is 63 characters limit warning for name', async () => {
    const { container } = render(
      <DeployService
        type={StepType.DeployService}
        initialValues={{
          service: {
            identifier: 'New_Service',
            name: 'New Service',
            description: 'test',
            tags: {
              tag1: '',
              tag2: 'asd'
            }
          }
        }}
        stepViewType={StepViewType.Edit}
      />
    )
    fireEvent.click(getByText(container, 'editService'))
    const dialog = findDialogContainer()
    expect(dialog).toMatchSnapshot()
    fillAtForm([
      {
        container: dialog!,
        fieldId: 'name',
        type: InputTypes.TEXTFIELD,
        value: 'ljdlkcjv vldjvldkj dlvjdlvkj vljdlkvjd vlmdlfvm vlmdlkvj dlvdkl'
      }
    ])

    expect(getByText(dialog!, 'Limit of 63 characters is reached for name')).not.toBeNull()

    await act(async () => {
      fireEvent.click(getByText(dialog!, 'save'))
    })

    expect(container.querySelector('pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: New_Service
      "
    `)
  })

  test('should render edit service view (service ref), then select other', async () => {
    const { container } = render(
      <DeployService
        type={StepType.DeployService}
        initialValues={{ serviceRef: 'selected_service' }}
        stepViewType={StepViewType.Edit}
      />
    )
    fireEvent.click(
      document.body
        .querySelector(`[name="serviceRef"] + [class*="bp3-input-action"]`)
        ?.querySelector('[data-icon="chevron-down"]')!
    )
    fireEvent.click(getByText(document.body, 'QA asd TEst'))

    expect(container.querySelector('pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: QA
      "
    `)
  })
  test('should render edit service view (service), then select new', async () => {
    const { container } = render(
      <DeployService
        type={StepType.DeployService}
        initialValues={{
          service: {
            identifier: 'pass_service',
            name: 'Pass Service',
            description: 'test',
            tags: {
              tag1: '',
              tag2: 'asd'
            }
          }
        }}
        stepViewType={StepViewType.Edit}
      />
    )

    // Clear first
    await act(() => {
      fireEvent.click(
        document.body.querySelector(`[name="serviceRef"] + [class*="bp3-input-action"]`)?.childNodes?.[0]!
      )
    })
    fireEvent.click(
      document.body
        .querySelector(`[name="serviceRef"] + [class*="bp3-input-action"]`)
        ?.querySelector('[data-icon="chevron-down"]')!
    )
    fireEvent.click(getByText(document.body, 'QA asd TEst'))

    expect(container.querySelector('pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: QA
      "
    `)
  })

  test('should render inputSet View', async () => {
    const { container } = render(
      <DeployService
        type={StepType.DeployService}
        initialValues={{}}
        stepViewType={StepViewType.InputSet}
        path=""
        template={{
          serviceRef: RUNTIME_INPUT_VALUE
        }}
        allValues={{
          serviceRef: RUNTIME_INPUT_VALUE
        }}
      />
    )
    fireEvent.click(
      document.body
        .querySelector(`[name="serviceRef"] + [class*="bp3-input-action"]`)
        ?.querySelector('[data-icon="chevron-down"]')!
    )
    fireEvent.click(getByText(document.body, 'QA asd TEst'))
    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })
    expect(container.querySelector('.bp3-card > pre')?.innerHTML).toMatchInlineSnapshot(`
      "serviceRef: QA
      "
    `)
  })
})

describe('SeviceModal ', () => {
  test('should render Services modal', () => {
    const { container } = render(
      <TestWrapper>
        <NewEditServiceModal {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    fireEvent.click(getByText(container, 'save'))
    fireEvent.click(getByText(container, 'YAML'))
    fireEvent.click(getByText(container, 'save'))
    expect(container).toMatchSnapshot()
  })

  test('should validate edit mode snapshot', async () => {
    const { container } = render(
      <TestWrapper>
        <NewEditServiceModal
          {...props}
          isEdit={true}
          isService={false}
          data={{
            name: 'Service 101',
            identifier: 'Service_101',
            orgIdentifier: 'orgIdentifier',
            projectIdentifier: 'projectIdentifier'
          }}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(container.querySelector('input[value="Service 101"]')).toBeTruthy())

    fillAtForm([
      {
        container,
        fieldId: 'name',
        type: InputTypes.TEXTFIELD,
        value: 'Service 102'
      }
    ])

    await act(async () => {
      fireEvent.click(getByText(container, 'save'))
    })

    expect(container).toMatchSnapshot()
  })
})
