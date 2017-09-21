# @atomist/automation-client-samples

This repository contains a couple examples of command and event handlers
as well as ingestors for the Atomist API. 

It uses the [`@atomist/automation-client`](https://github.com/atomist/automation-client-ts) 
node module to implement a local client that connects to the Atomist API.

## Getting Started

### Prerequisites

#### Access to Atomist testing environment

In order to get access to this preview, please reach out to members of Atomist
in the #support channel of [atomist-community Slack team](https://join.atomist.com).

You'll receive an invite to a Slack team and GitHub organization that can be
used to explore this new approach to writing and running automations.

#### Node.js

Please install Node.js from https://nodejs.org/en/download/ .

To verify that the right versions are installed, please run:

```
$ node -v
v8.4.0
$ npm -v
5.4.1
```

## Running the samples

### Cloning the repository and installing dependencies

To get started run the following commands:

```
$ git clone git@github.com:atomist/automation-client-samples-ts.git
$ cd automation-client-samples-ts
$ npm install
```

### Configuring your environment

For the client to connect and authenticate to the Atomist API, a GitHub
personal access token is required. 

Please create a personal access token with `read:org` scope at https://github.com/settings/tokens.

Once you obtained the token make it available to the client by exporting it
into a environment variable:

```
$ export GITHUB_TOKEN=<your token goes here>
```

## Starting up the automation-client

To start the client, run the following command:

```
$ cd automation-client-samples-ts
$ npm run start
```

## Invoking a command handler from Slack

This samples project contains a simple [`HelloWorld`](https://github.com/atomist/automation-client-samples-ts/blob/master/src/commands/simple/HelloWorld.ts) command handler that can be invoked with `@atomist hello world` in the testing Slack team. Once you've submitted the command in Slack, you'll see the incoming and outgoing messages show up in the logs of your local automation-client.

Finally you should see a response from the bot in Slack.

## Triggering an event handler

You can trigger the [`CommentOnIssue`](https://github.com/atomist/automation-client-samples-ts/blob/master/src/events/CommentOnIssue.ts) event handler by simply creating a new issue in https://github.com/atomist-rugs/cd-test-01 and watching your terminal window.

The issue event will come in  and you'll see an outgoing message to Slack. This message is being sent to the `cd-test-01` channel in the testing Slack team.

## Dashboard and GraphQL data explorer

When the automation client has successfully established a connection to the
Atomist API server the Dashboard (work-in-progress) and GraphQL data explorer
will be available.

 * Dashboard: http://localhost:2866
 * GraphQL Data Explorer: http://localhost:2866/graphql

## Support

General support questions should be discussed in the `#support`
channel on our community Slack team
at [atomist-community.slack.com][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/automation-client-samples-ts/issues

## Development

You will need to install [node][] to build and test this project.

### Build and Test

Command | Reason
------- | ------
`npm install` | to install all the required packages
`npm run lint` | to run tslint against the TypeScript
`npm run compile` | to compile all TypeScript into JavaScript
`npm test` | to run tests and ensure everything is working
`npm run autotest` | run tests continuously (you may also need to run `tsc -w`)
`npm run clean` | remove stray compiled JavaScript files and build directory

### Release

To create a new release of the project, simply push a tag of the form
`M.N.P` where `M`, `N`, and `P` are integers that form the next
appropriate [semantic version][semver] for release.  The version in
the package.json is replaced by the build and is totally ignored!  For
example:

[semver]: http://semver.org

```
$ git tag -a 1.2.3
$ git push --tags
```

The Travis CI build (see badge at the top of this page) will publish
the NPM module and automatically create a GitHub release using the tag
name for the release and the comment provided on the annotated tag as
the contents of the release notes.

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack team][slack].

[atomist]: https://www.atomist.com/
[slack]: https://join.atomist.com
