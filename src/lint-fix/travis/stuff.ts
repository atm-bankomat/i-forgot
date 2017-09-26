import axios from 'axios';

import { logger } from "@atomist/automation-client/internal/util/logger";

export const publicTravisEndpoint = "https://api.travis-ci.org";

export const commonTravisHeaders = {
    "User-Agent": "MyClient/1.0.0",
    "Accept": "application/vnd.travis-ci.2+json"
}

export function isFailureReport(z: any): z is FailureReport {
    return z["circumstance"] !== undefined && z["error"] !== undefined
}
export interface FailureReport {
    circumstance: string,
    error: any
}


export interface TravisAuth {
    access_token: string
}

export function authorizeWithGithubToken(travisApiEndpoint: string, githubToken: string): Promise<TravisAuth | FailureReport> {
    return axios.post(`${travisApiEndpoint}/auth/github`,
        { "github_token": githubToken },
        {
            headers: {
                ...commonTravisHeaders,
                "Content-Type": "application/json"
            }
        }).then(response => {
            return response.data as TravisAuth
        }).catch(e => {
            logger.error("Failure authenticating with Travis: " + e)
            return {
                circumstance: "authenticating with Travis",
                error: e
            }
        })
}

export function logFromJobId(travisApiEndpoint: string,
    jobIdPromise: Promise<number | FailureReport>):
    Promise<string | FailureReport> {
    return jobIdPromise.then(jobId => {
        if (isFailureReport(jobId)) { return jobId } else {
            const url = `${travisApiEndpoint}/jobs/${jobId}/log`
            // what happens if this is not available yet? I do not know. Then would we have a log ID in the job info?
            // because we don't have that, in this old build.
            return axios.get(url,
                {
                    headers: {
                        ...commonTravisHeaders,
                        "Accept": "text/plain"
                    }
                }).then(response => {
                    const data = response.data as string;
                    return data;
                }).catch(e => {
                    logger.error("Failure retrieving log: " + e)
                    return {
                        circumstance: "getting: " + url,
                        error: e
                    }
                })
        }
    });
}


interface TravisBuilds {
    builds: {
        id: number,
        job_ids: number[],
        state: string,
    }[],
    commits: {
        id: number,
        sha: string,
        branch: string,
    }[]
}

export type JobId = number;


export function jobIdForBuild(travisApiEndpoint: string,
    auth: Promise<TravisAuth | FailureReport>,
    repoSlug: string,
    buildNumber: string
): Promise<JobId | FailureReport> {

    const buildInfo: Promise<TravisBuilds | FailureReport> = auth.then(a => {
        if (isFailureReport(a)) { return a } else {
            const url = `${travisApiEndpoint}/repos/${repoSlug}/builds?number=${buildNumber}`
            return axios.get(url,
                {
                    headers: {
                        ...commonTravisHeaders,
                        "Authorization": `token ${a.access_token}`
                    }
                }).then(response => {
                    const data = response.data as TravisBuilds;
                    if (data.builds.length === 0) {
                        return {
                            circumstance: "Fetched build with: " + url,
                            error: "There are no builds returned",
                        }
                    }
                    return data;
                }).catch(e => {
                    logger.error("Failure retrieving repo: " + e)
                    return {
                        circumstance: "getting: " + url,
                        error: e
                    }
                })
        }
    });

    return buildInfo.then(b => {
        if (isFailureReport(b)) { return b } else {
            const jobIds = b.builds[0].job_ids
            console.log("Job IDs: " + JSON.stringify(jobIds));
            if (!jobIds || jobIds.length === 0) {
                return {
                    circumstance: `getting job IDs out of build ${b.builds[0].id} info: ${jobIds}`,
                    error: "no Job ID",
                }
            }
            const jobId = jobIds[0]; // can there be more than one? what does it mean if there is?
            return jobId;
        }
    })
}