# Cascading Tests

an automation to solve the problem of:

will my PR to this upstream (library) project break anything in this downstream (service) project?

Currently we check this by hand. It takes a while, and it's an interruption, and sometimes we forget and break things.

Concretely, I want this for atomist/microgrammar -> atomist/automation-client-samples-ts

## How?

When a PR is created upstream (in microgrammar), trigger a build downstream (in samples-ts). When that build completes, report its status back to the microgrammar PR.

## No really, how?

### publish to npm

I've added to the PR build in microgrammar the functionality to publish _a new module that includes the branch name_ to private npm.

Subsequent pushes to that PR publish to that same new module name, with the version incremented.

It also tags the commit with a special tag in the format newModuleName-newModuleVersion.

### trigger the downstream build

I've started a command handler to do this, in https://github.com/atm-osphere/automation-client/blob/travis-work/src/cascading-tests/StartDownstreamTests.ts (branch travis-work, which has turned into my everything-i-would-put-in-a-new-automation-if-that-handler-worked branch). It isn't tested.

It triggers on completion of a PR build in microgrammar.

It needs to push to a matching branch name in the downstream project, change the dependency from microgrammar:version to the module and version in the commit tag.

add: make a pending status on the original commit.

### react to that build completion

Not started. When that build completes, push a status to the original upstream commit, success or fail.

### clean up

When the upstream PR is closed, unpublish the npm module.
Submit a PR for the downstream branch!
