/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ResponseResourceGroupV2Response } from 'services/resourcegroups'

export const resourceTypes = {
  status: 'SUCCESS',
  data: {
    resourceTypes: [
      {
        name: 'SECRET',
        validatorTypes: ['BY_RESOURCE_IDENTIFIER', 'BY_RESOURCE_TYPE', 'BY_RESOURCE_TYPE_INCLUDING_CHILD_SCOPES']
      },
      {
        name: 'CONNECTOR',
        validatorTypes: ['BY_RESOURCE_IDENTIFIER', 'BY_RESOURCE_TYPE', 'BY_RESOURCE_TYPE_INCLUDING_CHILD_SCOPES']
      },
      { name: 'PIPELINE', validatorTypes: ['BY_RESOURCE_TYPE_INCLUDING_CHILD_SCOPES'] }
    ]
  },
  metaData: null,
  correlationId: '31eb8018-a8b5-4c6a-bf9f-2b378e020f5e'
}
export const resourceGroupDetails: ResponseResourceGroupV2Response = {
  status: 'SUCCESS',
  data: {
    resourceGroup: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'ewrewew',
      name: 'nameewrewew',
      includedScopes: [
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        }
      ],
      resourceFilter: {
        includeAllResources: false,
        resources: [{ resourceType: 'SECRET' }]
      },
      tags: {},
      description: '',
      color: '#0063f7'
    },
    createdAt: 1614689768311,
    lastModifiedAt: 1614689892647,
    harnessManaged: false
  },
  correlationId: '8e547da2-ed72-4327-a74d-874a825f8a20'
}
export const resourceGroupDetailsWithHarnessManaged: ResponseResourceGroupV2Response = {
  status: 'SUCCESS',
  data: {
    resourceGroup: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'ewrewew',
      name: 'nameewrewew',
      includedScopes: [
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        }
      ],
      resourceFilter: {
        includeAllResources: false,
        resources: [{ resourceType: 'SECRET' }]
      },
      tags: {},
      description: '',
      color: '#0063f7'
    },
    createdAt: 1614689768311,
    lastModifiedAt: 1614689892647,
    harnessManaged: true
  },
  correlationId: '8e547da2-ed72-4327-a74d-874a825f8a20'
}

export const accountResourceGroupDetails: ResponseResourceGroupV2Response = {
  status: 'SUCCESS',
  data: {
    resourceGroup: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'ewrewew',
      name: 'nameewrewew',
      includedScopes: [
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        },
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
          orgIdentifier: 'default'
        },
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
          orgIdentifier: 'default',
          projectIdentifier: 'Project_1'
        }
      ],
      resourceFilter: {
        includeAllResources: false,
        resources: [{ resourceType: 'SECRET' }]
      },
      tags: {},
      description: '',
      color: '#0063f7'
    },
    createdAt: 1614689768311,
    lastModifiedAt: 1614689892647,
    harnessManaged: false
  },
  correlationId: '8e547da2-ed72-4327-a74d-874a825f8a20'
}

export const orgResourceGroupDetails: ResponseResourceGroupV2Response = {
  status: 'SUCCESS',
  data: {
    resourceGroup: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'ewrewew',
      name: 'nameewrewew',
      includedScopes: [
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
          orgIdentifier: 'default'
        },
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
          orgIdentifier: 'default',
          projectIdentifier: 'Project_1'
        },
        {
          filter: 'INCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
          orgIdentifier: 'testOrg'
        }
      ],
      resourceFilter: {
        includeAllResources: false,
        resources: [{ resourceType: 'SECRET' }]
      },
      tags: {},
      description: '',
      color: '#0063f7'
    },
    createdAt: 1614689768311,
    lastModifiedAt: 1614689892647,
    harnessManaged: false
  },
  correlationId: '8e547da2-ed72-4327-a74d-874a825f8a20'
}
export const orgMockData = {
  data: {
    status: 'SUCCESS',
    data: {
      pageCount: 1,
      itemCount: 3,
      pageSize: 50,
      content: [
        {
          organization: {
            accountIdentifier: 'testAcc',
            identifier: 'testOrg',
            name: 'Org Name',
            description: 'Description',
            tags: { tag1: '', tag2: 'tag3' }
          }
        },
        {
          organization: {
            accountIdentifier: 'testAcc',
            identifier: 'default',
            name: 'default',
            description: 'default',
            tags: { tag1: '', tag2: 'tag3' }
          },
          harnessManaged: true
        }
      ],
      pageIndex: 0,
      empty: false
    },
    metaData: undefined,
    correlationId: '370210dc-a345-42fa-b3cf-69bd64eb5073'
  },
  loading: false
}

export const projectMockData = [
  {
    project: {
      accountIdentifier: 'testAcc',
      orgIdentifier: 'default',
      identifier: 'TestCiproject',
      name: 'TestCiproject',
      color: '#0063F7',
      modules: ['CI', 'CD'],
      description: '',
      tags: {},
      lastModifiedAt: 1607348985778
    }
  },
  {
    project: {
      accountIdentifier: 'testAcc',
      orgIdentifier: 'default',
      identifier: 'test11',
      name: 'test11',
      color: '#0063F7',
      modules: ['CD'],
      description: '',
      tags: {},
      lastModifiedAt: 1607075878518
    }
  },
  {
    project: {
      accountIdentifier: 'testAcc',
      orgIdentifier: 'default',
      identifier: 'Project_1',
      name: 'Project 1',
      color: '#0063F7',
      modules: [],
      description: '',
      tags: {},
      lastModifiedAt: 1607064454225
    }
  },
  {
    project: {
      accountIdentifier: 'testAcc',
      orgIdentifier: 'testOrg',
      identifier: 'fdfder32432',
      name: 'fdfder32432',
      color: '#0063F7',
      modules: ['CD', 'CF', 'CE', 'CI', 'CV'],
      description: '',
      tags: {},
      lastModifiedAt: 1607060784209
    }
  }
]
