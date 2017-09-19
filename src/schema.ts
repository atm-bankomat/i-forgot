/* tslint:disable */
//  This file was automatically generated and should not be edited.

export type PersonQueryVariables = {
  teamId: string,
  slackUser: string,
};

export type PersonQuery = {
  ChatTeam:  Array< {
    __typename: "undefined",
    // name of  ChatTeam
    name: string | null,
    // ChatTeam members ChatId
    members:  Array< {
      __typename: string,
      // screenName of  ChatId
      screenName: string | null,
      // ChatId person Person
      person:  {
        __typename: string,
        // forename of  Person
        forename: string | null,
        // surname of  Person
        surname: string | null,
      } | null,
    } | null > | null,
  } | null > | null,
};

export type PushWithRepoSubscription = {
  Push:  Array< {
    __typename: "undefined",
    // Push builds Build
    builds:  Array< {
      __typename: string,
      // buildUrl of  Build
      buildUrl: string | null,
      // name of  Build
      name: string | null,
      // provider of  Build
      provider: string | null,
      // Build commit Commit
      commit:  {
        __typename: string,
        // sha of  Commit
        sha: string | null,
      } | null,
    } | null > | null,
    // Push before Commit
    before:  {
      __typename: string,
      // sha of  Commit
      sha: string | null,
    } | null,
    // Push after Commit
    after:  {
      __typename: string,
      // sha of  Commit
      sha: string | null,
      // Commit statuses Status
      statuses:  Array< {
        __typename: string,
        // context of  Status
        context: string | null,
        // description of  Status
        description: string | null,
        // targetUrl of  Status
        targetUrl: string | null,
      } | null > | null,
    } | null,
    // Push repo Repo
    repo:  {
      __typename: string,
      // owner of  Repo
      owner: string | null,
      // name of  Repo
      name: string | null,
      // Repo channels ChatChannel
      channels:  Array< {
        __typename: string,
        // name of  ChatChannel
        name: string | null,
      } | null > | null,
      // Repo labels Label
      labels:  Array< {
        __typename: string,
        // name of  Label
        name: string | null,
      } | null > | null,
      // Repo org Org
      org:  {
        __typename: string,
        // Org provider GitHubProvider
        provider:  {
          __typename: string,
          // url of  GitHubProvider
          url: string | null,
          // apiUrl of  GitHubProvider
          apiUrl: string | null,
          // gitUrl of  GitHubProvider
          gitUrl: string | null,
        } | null,
      } | null,
    } | null,
    // Push commits Commit
    commits:  Array< {
      __typename: string,
      // sha of  Commit
      sha: string | null,
      // Commit resolves Issue
      resolves:  Array< {
        __typename: string,
        // number of  Issue
        number: number | null,
        // name of  Issue
        name: string | null,
        // title of  Issue
        title: string | null,
      } | null > | null,
      // Commit impact ParentImpact
      impact:  {
        __typename: string,
        // data of  ParentImpact
        data: string | null,
        // url of  ParentImpact
        url: string | null,
      } | null,
      // Commit apps Application
      apps:  Array< {
        __typename: string,
        // state of  Application
        state: string | null,
        // host of  Application
        host: string | null,
        // domain of  Application
        domain: string | null,
        // data of  Application
        data: string | null,
      } | null > | null,
      // Commit tags Tag
      tags:  Array< {
        __typename: string,
        // name of  Tag
        name: string | null,
        // Tag release Release
        release:  {
          __typename: string,
          // name of  Release
          name: string | null,
        } | null,
        // Tag containers DockerImage
        containers:  Array< {
          __typename: string,
          // DockerImage pods K8Pod
          pods:  Array< {
            __typename: string,
            // host of  K8Pod
            host: string | null,
            // state of  K8Pod
            state: string | null,
            // name of  K8Pod
            name: string | null,
          } | null > | null,
        } | null > | null,
      } | null > | null,
      // Commit author GitHubId
      author:  {
        __typename: string,
        // login of  GitHubId
        login: string | null,
        // GitHubId person Person
        person:  {
          __typename: string,
          // Person chatId ChatId
          chatId:  {
            __typename: string,
            // screenName of  ChatId
            screenName: string | null,
          } | null,
        } | null,
      } | null,
    } | null > | null,
  } | null > | null,
};
/* tslint:enable */
