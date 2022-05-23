export const accountIdentifier = 'accountId'
export const orgIdentifier = 'default'
export const projectIdentifier = 'project1'
export const module = 'cd'

// APIs
export const environmentsCall = `/ng/api/environmentsV2?routingId=${accountIdentifier}&accountIdentifier=${accountIdentifier}&orgIdentifier=${orgIdentifier}&projectIdentifier=${projectIdentifier}&page=0&size=10`
export const environmentGroupsCall = `/ng/api/environmentGroup/list?routingId=${accountIdentifier}&accountIdentifier=${accountIdentifier}&projectIdentifier=${projectIdentifier}&orgIdentifier=${orgIdentifier}&size=10&page=0&sort=lastModifiedAt%2CDESC`
export const createEnvironmentGroupsCall = `/ng/api/environmentGroup?accountIdentifier=${accountIdentifier}`
export const environmentGroupDetailsCall = `/ng/api/environmentGroup/testEnvGroup?routingId=${accountIdentifier}&accountIdentifier=${accountIdentifier}&orgIdentifier=${orgIdentifier}&projectIdentifier=${projectIdentifier}`
export const environmentGroupYamlSchemaCall = `/ng/api/yaml-schema?routingId=${accountIdentifier}&entityType=EnvironmentGroup&projectIdentifier=${projectIdentifier}&orgIdentifier=${orgIdentifier}&accountIdentifier=${accountIdentifier}&scope=project`

// BROWSER ROUTES
export const environmentGroupRoute = `#/account/${accountIdentifier}/${module}/orgs/${orgIdentifier}/projects/${projectIdentifier}/environment-group`
export const environmentRoute = `#/account/${accountIdentifier}/cd/orgs/${orgIdentifier}/projects/${projectIdentifier}/environment`
