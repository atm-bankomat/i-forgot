# @atomist/automation-client-samples

This repository contains sample code demonstrating use of
the [Atomist][atomist] API.  You will find examples illustrating:

-   Creating bot commands using _command handlers_
-   Responding to DevOps events, e.g., someone commenting on an issue,
    using _event handlers_
-   Ingestors _(coming soon)_

These example use the [`@atomist/automation-client`][client] node
module to implement a local client that connects to the Atomist API.

[client]: https://github.com/atomist/automation-client-ts (@atomist/automation-client Node Module)

## Prerequisites

### Access to Atomist testing environment

To get access to this preview, please reach out to members of Atomist
in the `#support` channel of [atomist-community Slack team][slack].

You'll receive an invitation to a Slack team and GitHub organization
that can be used to explore this new approach to writing and running
automations.

### Node.js

You will need to have [Node.js][node] installed.  To verify that the
right versions are installed, please run:

```
$ node -v
v8.4.0
$ npm -v
5.4.1
```

[node]: https://nodejs.org/ (Node.js)

### Cloning the repository and installing dependencies

To get started run the following commands:

```
$ git clone git@github.com:atomist/automation-client-samples-ts.git
$ cd automation-client-samples-ts
$ npm install
```

### Configuring your environment

For the client to connect and authenticate to the Atomist API, a
GitHub personal access token is required. Additionally the API
is only allowing members of a GitHub team called `atommist-automation`
to successfully authenticate and register a new client.

Please create a team in your GitHub organization with the name
`atomist-automation` and add the user you want to use to the team. 

After that you can create a personal access token with `read:org` 
scope at https://github.com/settings/tokens. 

Once you obtained the token, make it available to the client by
exporting it into a environment variable:

```
$ export GITHUB_TOKEN=<your token goes here>
```

Alternatively you can also place the token in `src/atomist.config.ts`.

## Starting up the automation-client

To start the client, run the following command:

```
$ npm run start
```

## Invoking a command handler from Slack

This project contains the code to create and respond to a simple
`hello world` bot command.  The code that defines the bot command and
implements responding to the command, i.e., the _command handler_, can
be found in [`HelloWorld.ts`][hello].  Once you have your local
automation client running (the previous step in this guide), you can
invoke the command handler by sending the Atomist bot the command in
the `#general` channel of the testing Slack team:

```
@atomist hello world
```

Once you've submitted the command in Slack, you'll see the incoming
and outgoing messages show up in the logs of your locally running
automation-client.  Ultimately, you should see the response from the
bot in Slack.

[hello]: https://github.com/atomist/automation-client-samples-ts/blob/master/src/commands/simple/HelloWorld.ts (HelloWorld Command Handler)

Feel free to modify the code in the `HelloWorld` command handler,
restart your local automation client, and see what happens!

## Triggering an event handler

While command handlers respond to commands you send the Atomist bot,
_event handlers_ take action when different types of events occur in
your development and operations environment.  Some examples of events
are commits are pushed to a repo, or a CI build fails, or an instance
of a running service becomes unhealthy.  Example responses to those
events are showing the commits in a Slack message, automatically
restarting the build, and triggering a PagerDuty alert, respectively.

The sample event handler in this project will notice when a new issue
is created in the [atomist-rugs][] GitHub organization and then send a
Slack message and post its own comment on the issue.  You can trigger
the [`CommentOnIssue`][issue-handler] event handler by
simply
[creating an issue in the atomist-rugs/cd-test-01 repo][create-issue].
You should see that event appear in the console logs of your locally
running automation client, followed by a log of the actions the event
handler is taking.  Once those actions are complete, you should see a
new message in the `#cd-test-01` channel in the testing Slack team and
a new comment on the issue you just created.

[issue-handler]: https://github.com/atomist/automation-client-samples-ts/blob/master/src/events/CommentOnIssue.ts (CommentOnIssue Event Handler)
[create-issue]: https://github.com/atomist-rugs/cd-test-01/issues/new (Create Issue in atomist-rugs/cd-test-01)

## Dashboard and GraphQL data explorer

When the automation client has successfully established a connection
to the Atomist API server, the Dashboard (work-in-progress) and
GraphQL data explorer will be available.

*   Dashboard: http://localhost:2866
*   GraphQL Data Explorer: http://localhost:2866/graphql

## Support

General support questions should be discussed in the `#support`
channel in our community Slack team
at [atomist-community.slack.com][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/automation-client-samples-ts/issues

## Development

You will need to install [node][] to build and test this project.

### Build and Test

Command | Reason
------- | ------
`npm install` | to install all the required packages
`npm run start` | to start the Atomist automation client
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
