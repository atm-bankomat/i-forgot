import { Microgrammar } from '@atomist/microgrammar/Microgrammar';

export function analyzeLog(log: string): string {
    // simplest thing: last few lines
    return log.split("\n").slice(-30).join("\n");
}