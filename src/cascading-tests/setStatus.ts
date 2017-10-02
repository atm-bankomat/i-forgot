import axios from "axios";

const ApiBase = "https://api.github.com";

/**
 * Set a Github Status
 */
export function setStatus(token: string, status: Status, owner: string, repo: string, sha: string): Promise<any> {
    const url = `${ApiBase}/repos/${owner}/${repo}/statuses/${sha}`;
    const config = {
        headers: {
            Authorization: `token ${token}`,
        },
    };
    return axios.post(url, status, config);
}

export interface Status {

    state: "success" | "failure";

    target_url?: string;

    context?: string;

    description: string;
}
