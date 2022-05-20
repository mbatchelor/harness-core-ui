This repo contains code used in the [Harness CD Community Edition](https://github.com/harness/harness-cd-community) which is licensed under the [PolyForm Shield License 1.0.0](./licenses/PolyForm-Shield-1.0.0.txt). This repo also contains code belonging to Harness CD Enterprise Plan which is licensed under the [PolyForm Free Trial License 1.0.0](./licenses/PolyForm-Free-Trial-1.0.0.txt). You may obtain a copy of these licenses in the [licenses](./licenses/) directory at the root of this repository.

# Harness Next Gen UI

Grouped Code Coverage report for master branch: [Coverage Report](https://github.com/harness/harness-core-ui/wiki/Coverage)

## Important Links

- [Workflow for creating docker image from any branch](https://app.harness.io/ng/#/account/vpCkHKsDSxK9_KYfjCTMKA/ci/orgs/default/projects/NextGenUI/pipelines/NG_Docker_Image/executions)
- [Release Build Workflows](https://stage.harness.io/ng/#/account/wFHXHD0RRQWoO8tIZT5YVw/ci/orgs/Harness/projects/R[…]EBUILDS/pipelines/nextGenUI_release_build/executions)
- [New Branch Cut Workflow](https://stage.harness.io/ng/#/account/wFHXHD0RRQWoO8tIZT5YVw/ci/orgs/Harness/projects/RELEASEBUILDS/pipelines/nextGenUI_cutBranch/executions)

## Documentation

[Documentation](./docs/README.md)

### Getting Started

1. Install **NodeJS v16**. There are many ways to do this (**choose any one**):

   - Download relevant package from https://nodejs.org/download/release/v16.15.0/, unpack and install.
   - Use Homebrew: `brew install node@16`
   - If you already have Node installed, use `nvm` or `n` to install/select correct version. (see https://www.npmjs.com/package/n)

2. Install **yarn** package manager

```
$ brew install yarn
```

> Note: More options here: https://classic.yarnpkg.com/en/docs/install

3. Clone this repo

```
$ git clone git@github.com:harness/harness-core-ui.git
$ cd harness-core-ui
```

4. Add config to make Harness Github Package Registry accessible

```
$ yarn setup-github-registry
```

> Note: This is only needed if this is the first UI project you are installing on your machine

5. Install/Update/Refresh dependencies

```
$ yarn
```

> Note: This will take some time the first time you run it. Subsequent runs should be near-instant. Run this everytime you change branches or take a pull. If there are no dependency changes, this is practically a no-op.

> Note: This is a shorthand for the command `yarn install`. Read more here: https://classic.yarnpkg.com/en/docs/usage

6. Compile/Build the code **and** start the web-server in watch mode

```
$ yarn dev
```

> Note: This will start the local server in watch mode with hot reloading. Any code changes will trigger fast patch rebuilds and refresh the page in the browser.

</details>

### Publishing

```
$ yarn build
$ yarn docker <tagname>
```

First command will create a production build (minified, optimised).

Second command will create a docker image and _publish_ it to `harness/nextgenui` Dockerhub repo.

### Configuring Proxies (optional)

You can configure/manage proxies for local development in the file `webpack.config.js`. Sample:

```
proxy: {
   '/cd/api': {
     logLevel: 'info',
     target: 'http://localhost:7457',
     pathRewrite: { '^/cd/api': '' }
  }
},
```

> Note: These proxies are only relevant for local development. This config file is used by `webpack-dev-server` package, which we use to serve files locally. This is **not** used in the docker builds.

> The docker builds all use `nginx` to serve the built files, whose configuration is stored at `scripts/nginx.conf`. This config is shared for prod builds, so please pay attention if making changes.

### Auto-generating services

See [src/services/README.md](https://github.com/harness/harness-core-ui/blob/master/src/services/README.md)

### Local development against remote environments

You can configure the application to use remote environments such as `uat.harness.io`, `qa.harness.io` or `qb.harness.io` to allow local UI development without the need to run backend services. To achieve this, two environment variables are available.

| Variable            | Default value                   | Description                                                                  |
|---------------------|---------------------------------|------------------------------------------------------------------------------|
| `BASE_URL`          | `https://qa.harness.io/gateway` | Location of backend services to access                                       |
| `TARGET_LOCALHOST`  | `true`                          | Whether to use local backend services. Set to `false` to use remote services |
| `DISABLE_TYPECHECK` | `false`                         | Whether to disable the `ForkTsCheckerWebpackPlugin` for local development    |

These environment variables can be passed in a number of ways including being set in your `.bashrc` or `.zshrc` file, set in a `.env` file in the root of the application (see [`.env.example`](./.env.example)), or passed when starting the dev server as below.

```shell
$ TARGET_LOCALHOST=false yarn dev
```

### Utilities

Run lint checks

```
$ yarn lint
```

Run unit tests

```
$ yarn test
```

### Hotfix Process

1. Find out which release branch you need to hotfix. You can do that checking the currently deployed version in the environment you want to hotfix. For eg. For UAT environment, you can hit https://uat.harness.io/ng/static/version.json to get the currently deployed version. (eg. `0.53.4`)
2. Create a branch from the corresponding release branch (eg. `release/0.53.x`) which you want to hotfix
3. Commit your changes on your branch
4. Bump up the patch version in `package.json` (eg. 0.53.0 -> 0.53.1)
5. Raise PR with these changes
6. When this PR gets merged, this [Workflow](https://uat.harness.io/ng/#/account/sjmVqavzTuS1segZNyZqbA/ci/orgs/default/projects/uiprchecks/pipelines/build_release_branch/executions) will create a new build for you automatically
7. Please inform Ops/QE team to deploy your new build, especially in QA, UAT or prod environment.
8. Make sure to raise a PR with the same changes (minus the version bump) for `master` branch too. Otherwise your changes will get overriden with next deployment.

## For wndows environment setup only

#### Download Git bash for windows

Use git bash for executing any git command and it is also helpful to run scripts of package.json where shell script is used.

https://git-scm.com/download/win

#### Git clone

If you face any issue while taking clone of this repo in Windows operating system. Kindly refer below.

For development \*NIX system is preferred. On Windows 10 you can use [Ubuntu via WSL](https://ubuntu.com/wsl)

#### Running scripts

To run various scripts of package.json , you need to install dev dependency "cross-env": "^7.0.3"(any latest version) in package.json.
Example:-

1. To run this script "dev": "NODE_ENV=development webpack-dev-server --progress", just change it to "dev": "cross-env NODE_ENV=development webpack-dev-server --progress"
2. To run shell script "setup-github-registry": "sh scripts/setup-github-registry.sh", just change it to "setup-github-registry": "cross-env scripts/setup-github-registry.sh"

> Note: Similary you can update the scripts part wherever needed as per above to run in windows environment.
