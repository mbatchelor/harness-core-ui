/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getAllByRole, getByPlaceholderText, getByText, render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

import { Formik, FormikForm } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import routes from '@common/RouteDefinitions'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import {
  getMultiSelectFormOptions,
  PipelineExecutionFormType
} from '@pipeline/utils/PipelineExecutionFilterRequestUtils'

import PipelineFilterForm from '../ExecutionListFilterForm'
import services from '../../../pipelines/__tests__/mocks/services.json'
import deploymentTypes from '../../../pipelines/__tests__/mocks/deploymentTypes.json'
import environments from '../../../pipelines/__tests__/mocks/environments.json'

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline1',
  module: 'cd'
}

const TEST_PATH = routes.toPipelines({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })

function WrapperComponent(): JSX.Element {
  return (
    <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
      <Formik initialValues={{}} onSubmit={() => undefined} formName="pipelineFilterFormTest">
        <FormikForm>
          <PipelineFilterForm<PipelineExecutionFormType>
            isCDEnabled={true}
            isCIEnabled={true}
            initialValues={{
              deploymentType: getMultiSelectFormOptions(deploymentTypes.data),
              services: getMultiSelectFormOptions(services.data.content),
              environments: getMultiSelectFormOptions(environments.data.content)
            }}
            type="PipelineExecution"
          />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}

describe('<PipelineFilterForm /> test', () => {
  test('snapshot testing', () => {
    const { container } = render(<WrapperComponent />)
    expect(container).toMatchSnapshot()
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('change values of all the field in filter form', async () => {
    const { container } = render(<WrapperComponent />)
    const tagInputValues = container.getElementsByClassName('bp3-tag-input-values')
    expect(tagInputValues).toHaveLength(3)

    // Filter Name
    const nameInput = getByPlaceholderText(container, 'pipeline.filters.pipelineNamePlaceholder')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'test name' } })
    })

    // Status Selection
    const statusInput = container.querySelector('[name="status"]') as HTMLElement
    await act(async () => {
      fireEvent.change(statusInput, { target: { value: 't' } })
    })
    const listItems = getAllByRole(container, 'listitem')
    expect(listItems).toHaveLength(3)
    await act(async () => {
      fireEvent.click(listItems[0])
    })
    const selectedTag = getByText(tagInputValues[0] as HTMLElement, 'Aborted')
    expect(selectedTag).toBeDefined()
  })
})
