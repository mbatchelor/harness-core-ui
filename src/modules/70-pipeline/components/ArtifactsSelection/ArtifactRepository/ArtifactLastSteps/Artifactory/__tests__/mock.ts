/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { MultiTypeInputType } from '@harness/uicore'
import type { ArtifactType } from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'

export const props = {
  name: 'Artifact details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  context: 2,
  handleSubmit: jest.fn(),
  artifactIdentifiers: [],
  selectedArtifact: 'Nexus3Registry' as ArtifactType,
  selectedDeploymentType: ServiceDeploymentType.Kubernetes
}

export const serverlessDeploymentTypeProps = {
  name: 'Artifact details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  context: 1,
  handleSubmit: jest.fn(),
  artifactIdentifiers: [],
  selectedArtifact: 'ArtifactoryRegistry' as ArtifactType,
  selectedDeploymentType: ServiceDeploymentType.ServerlessAwsLambda,
  prevStepData: {
    connectorId: {
      value: 'connectorRef'
    }
  }
}

export const repoMock = {
  data: {
    repositories: {
      testRepo: 'generic-local',
      anotherRepo: 'generic repo'
    }
  }
}

export const useGetRepositoriesDetailsForArtifactoryFailure = {
  data: {
    status: 'FAILURE',
    errors: [
      {
        fieldId: 'repository',
        error: 'fetch failed'
      }
    ]
  }
}

export const useGetRepositoriesDetailsForArtifactoryError = {
  data: {
    status: 'ERROR',
    message: 'error'
  }
}

export const emptyRepoMockData = {
  data: {
    repositories: {}
  }
}
