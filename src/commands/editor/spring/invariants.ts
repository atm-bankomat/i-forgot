import { Project } from "@atomist/automation-client/project/Project";

// TODO this will move to samples and be async using new findFile promise method

/**
 * Pass through validating something. Used to assert invariants in editors.
 * @param {Project} p
 * @param {string} path
 * @param {string} content
 * @return {Promise<Project>}
 */
export function assertContent(p: Project, path: string, assertion: (string) => boolean, err?: string): Promise<Project> {
    const f = p.findFileSync(path);
    return (f && assertion(f.getContentSync())) ?
        Promise.resolve(p) :
        Promise.reject(
            err ? err : `Assertion failed about project ${p.name}: ${assertion}`);
}

export function assertContentIncludes(p: Project, path: string, what: string): Promise<Project> {
    return assertContent(p, path, content => content.includes(what),
        `File at ${path} did not contain [${what}]`);
}
