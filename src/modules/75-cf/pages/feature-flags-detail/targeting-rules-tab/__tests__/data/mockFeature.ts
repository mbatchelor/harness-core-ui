/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Feature } from 'services/cf'

const mockFeature: Feature = {
  archived: false,
  createdAt: 1645011391656,
  defaultOffVariation: 'false',
  defaultOnVariation: 'true',
  description: '',
  envProperties: {
    pipelineConfigured: false,
    pipelineDetails: undefined,
    defaultServe: { variation: 'true' },
    environment: 'qatest',
    modifiedAt: 1646928280967,
    offVariation: 'false',
    rules: [
      {
        clauses: [
          {
            attribute: '',
            id: 'd36b6624-c514-4b94-94c7-9f558324badf',
            negate: false,
            op: 'segmentMatch',
            values: ['target_group_4']
          }
        ],
        priority: 100,
        ruleId: '9dec5abb-002e-45b3-b241-963ac5d9acde',
        serve: { variation: 'false' }
      },
      {
        clauses: [
          {
            attribute: '',
            id: 'd231f9dc-102a-49e0-9c26-2e2e3de99539',
            negate: false,
            op: 'segmentMatch',
            values: ['target_group_5']
          }
        ],
        priority: 101,
        ruleId: '3ead64d0-3226-4726-8415-acce803fa34e',
        serve: { variation: 'false' }
      },
      {
        clauses: [
          {
            attribute: '',
            id: '0023fcae-39ee-4cc5-ae6b-ea7ba20733dc',
            negate: false,
            op: 'segmentMatch',
            values: ['target_group_1']
          }
        ],
        priority: 102,
        ruleId: '455c109e-c995-4a4c-adb0-086ddd22ca39',
        serve: {
          distribution: {
            bucketBy: 'name',
            variations: [
              {
                variation: 'true',
                weight: 45
              },
              {
                variation: 'false',
                weight: 55
              }
            ]
          }
        }
      }
    ],
    state: 'on',
    variationMap: [{ targets: [{ identifier: 'target1', name: 'target_1' }], variation: 'false' }]
  },
  evaluation: '',
  evaluationIdentifier: '',
  identifier: 'newflag',
  kind: 'boolean',
  modifiedAt: 1646928280965,
  name: 'newflag',
  owner: ['chris.blakely@harness.io'],
  permanent: false,
  prerequisites: [],
  project: 'cmproj',
  results: [],
  status: { lastAccess: -6795364578871, status: 'never-requested' },
  tags: [],
  variations: [
    { identifier: 'true', name: 'True', value: 'true' },
    { identifier: 'false', name: 'False', value: 'false' }
  ]
}

export default mockFeature
