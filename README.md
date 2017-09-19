# README-Driven Development in process

hey y'all, this README represents what we're hoping customers will see. Some of the links in it are fiction. Let's smooth out all the bumps in it.

# Atomist automation node sample

Sample starting project for running development automations with Atomist, in TypeScript.

## Background

Atomist is a toolset for development automation. Get more background on Atomist [here](docs/atomist.md).

## Try it out

You can run an automation node on your own computer, and customize it to do what you like. 
Then you can deploy it to the cloud or your own infrastructure.

You can either build automations for your GitHub organization and Slack team (if you have admin access), 
or you can [try out Atomist in our sample organization and Slack team](docs/our-team.md) (not yet implemented).

### Work in your own team

First, sign up with Atomist [LINK]. You'll need to invite the bot to Slack and tell it which GitHub organization to care about.

#### get the code

Clone this repository, and then change a few things:

Name your automation node: in [package.json](package.json), change "name" to something of your choice.

Associate with your Slack team: in Slack, ask atomist for your team id; `@atomist pwd` in DM to @atomist or any channel that @atomist has been invited to.
In [atomist.config.ts](src/atomist.config.ts#L12), change "teamId" to the Slack ID of your team.

<img src="docs/images/find-team-id.png" width=243/>

Authenticate: to verify that you belong in this team, provide a GitHub token with read:org permissions. Atomist uses this to check that you are a member of your team's GitHub organization.

Put this token in an environment variable GITHUB_TOKEN, or stick it in the value of the "token" field in [atomist.config.ts](src/atomist.config.ts#L20).

#### Run the automation node

You'll need `npm` (v5.4.1) and `node` (v8.4.0).

    - `npm install`
    - `nom run compile`
    - `npm run start`

Your browser opens to a dashboard at localhost:2866.

When the node starts up, it connects to the Atomist API. It registers subscriptions to events and Slack commands.

Now activate some automations! This sample responds to `@atomist hello world` in Slack, so type that 
in your Slack channel. Atomist will quiz you for the command's parameters (in this case, your name), and then respond with a Slack message. After that, your dashboard will show that the command automation fired. Tweak the response in 
`hello world file.ts` and restart your node, if you like. (Or, start the node with `npm run autostart` for hot code reloading.)

[TODO: bring back CommentOnIssue, but narrow it! the current implementation will hit any issue across the org and will confuse people. Have it DM the automation node administrator. Or narrow it to one repository, or only issues created by the admin ... something not org-wide.]

#### Respond to repository events

Now see your automation respond to an event! There's a sample event handler, [NotifyOnPush](src/events/NotifyOnPush.ts), that listens for GitHub push events and sends a message to a Slack channel. Which Slack channel? Why, any Slack channel you choose. 

You can link a channel to a repository right in Slack. Go to any Slack channel and invite Atomist with `/invite @atomist`, and atomist will ask you whether you'd like to associate a repository. Choose one from the list. Or, if atomist is already in the channel, try `@atomist repo <repository name>`. Now atomist is configured to know where to send messages about that repository.

Make a push to the repository you selected (on any branch). The [NotifyOnPush](src/events/NotifyOnPush.ts) automation in your locally running node posts a message to the linked channel!

### Do more stuff

From here, you can play. You can do more in Slack [MORE DOCS], 
you can respond to PullRequests with comments and even automatic code modifications [MORE DOCS], and you can get more information about the events you're 
responding to [MORE DOCS].

### Deploy the node 

You can deploy the node anywhere. If you happen to use CloudFoundry, there's a [manifest.yml](manifest.yml) in this repository that'll work; you can `cf push` it right up.


