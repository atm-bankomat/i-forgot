import { configuration } from "../atomist.config";

const child_process = require("child_process");

function execufy(cmd: string, errorResult: string): Promise<string> {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout: string, stderr: string) => {
            if (error) {
                console.log(`stderr from ${cmd}: ${stderr}`);
                resolve(errorResult);
            } else {
                resolve(stdout);
            }
        });
    });
}

function describeLocal(): Promise<string> {
    return Promise.all(
        [execufy("git rev-parse HEAD", "(no sha)"),
        execufy("git diff-index --quiet HEAD --", " (dirty)"),
        execufy("hostname", "an unknown host")]).then(values => {
            const [sha, dirty, host] = values;
            return Promise.resolve(`this message brought to you by ${configuration.name}:${configuration.version} running on ${host} at ${sha}${dirty}`);
        });
}

interface CloudFoundryVcapApplication {
    space_id: string; instance_id: string; start: string;
}

function describeCloudFoundry(): Promise<string> {
    const vcap: CloudFoundryVcapApplication = JSON.parse(process.env.VCAP_APPLICATION);
    return Promise.resolve(
        `from: ${configuration.name}:${configuration.version} running in space ${vcap.space_id}, instance ${vcap.instance_id}, started on ${vcap.start}`);
}

export function whereAmIRunning(): Promise<string> {
    if (process.env.VCAP_APPLICATION) {
        return describeCloudFoundry();
    } else {
        return describeLocal();
    }
}
