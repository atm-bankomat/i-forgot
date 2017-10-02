
export interface GitHubIssueLabel {
    name: string;
}
export interface GitHubUser {
    login: string;
    avatar_url?: string;
}
export interface GitHubIssueResult {
    html_url: string;
    url: string;
    number: number;
    title: string;
    repository_url: string;
    assignees: GitHubUser[];
    user: GitHubUser;
    state: string; created_at: string;
    labels: GitHubIssueLabel[];
    updated_at: string;
}
export interface GitHubIssueSearchResult {
    total_count: number;
    items: GitHubIssueResult[];
}

export function hasLabel(item: GitHubIssueResult, labelName: string): boolean {
    return item.labels.some(l => l.name === labelName);
}
