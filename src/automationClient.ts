export function automationHandler(event, context, callback) {
   console.log("value1 = " + event.key1);
   console.log("value2 = " + event.key2);
   callback(null, "some success message");
}

import { automationClient } from "@atomist/automation-client/automationClient";
import { configuration } from "./atomist.config";

const config = configuration;
const node = automationClient(config);

if (config.commands) {
    config.commands.forEach(c => {
        node.withCommandHandler(c);
    });
}
if (config.events) {
    config.events.forEach(e => {
        node.withEventHandler(e);
    });
}

if (config.ingestors) {
    config.ingestors.forEach(e => {
        node.withIngestor(e);
    });
}

node.run();
