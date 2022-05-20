/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import type { DocumentNode } from 'graphql'
import { TestWrapper } from '@common/utils/testUtils'
import { FetchViewFieldsDocument } from 'services/ce/services'

import CreatePerspectivePage from '../CreatePerspectivePage'
import PerspectiveResponseData from '../../perspective-details/__test__/PerspectiveData.json'
import ViewFieldResponseData from '../../perspective-details/__test__/ViewFieldResponse.json'

jest.mock('services/ce', () => ({
  ...(jest.requireActual('services/ce') as any),
  useGetPerspective: jest.fn().mockImplementation(() => {
    return { data: PerspectiveResponseData, refetch: jest.fn(), error: null, loading: false }
  })
}))

jest.mock('@ce/components/CEChart/CEChart', () => 'mock')

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('test cases for Create Perspective Page', () => {
  test('should be able to render the Perspective Builder', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchViewFieldsDocument) {
          return fromValue(ViewFieldResponseData)
        }
        return fromValue({})
      }
    }

    const { getByText } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <CreatePerspectivePage />
        </Provider>
      </TestWrapper>
    )

    expect(getByText('AWS_GCP')).toBeDefined()
    expect(getByText('value3')).toBeDefined()
    expect(getByText('ce.perspectives.createPerspective.filters.rulesText1')).toBeDefined()
    expect(getByText('ce.perspectives.createPerspective.nextButton')).toBeDefined()
    expect(getByText('ce.perspectives.createPerspective.preview.title')).toBeDefined()
  })
})
