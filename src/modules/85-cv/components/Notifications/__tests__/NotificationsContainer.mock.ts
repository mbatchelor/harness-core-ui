export const mockedNotificationsTable = [
  {
    notificationRule: {
      orgIdentifier: 'default',
      projectIdentifier: 'SRMNotificationsTesting',
      identifier: 'asasas',
      name: 'asasas',
      type: 'ServiceLevelObjective',
      conditions: [
        {
          type: 'ErrorBudgetRemainingPercentage',
          spec: {
            threshold: 10
          }
        },
        {
          type: 'ErrorBudgetRemainingMinutes',
          spec: {
            threshold: 2
          }
        },
        {
          type: 'ErrorBudgetBurnRate',
          spec: {
            threshold: 2,
            lookBackDuration: '2m'
          }
        }
      ],
      notificationMethod: {
        type: 'Slack',
        spec: {
          userGroups: null,
          webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
        }
      },
      enabled: false
    },
    enabled: false,
    createdAt: 1652788835172,
    lastModifiedAt: 1652789124328
  }
]
