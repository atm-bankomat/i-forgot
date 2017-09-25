import axios from 'axios';

import { logger } from "@atomist/automation-client/internal/util/logger";

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