import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { atLeastOne } from "@atomist/microgrammar/Rep";
import { VersionedArtifact } from "./VersionedArtifact";

export const ELEMENT_NAME = /^[a-zA-Z_.0-9\-]+/;

export const ELEMENT_CONTENT = /^[a-zA-Z_.0-9\-]+/;

export const XML_TAG_WITH_SIMPLE_VALUE = {
    _l: "<",
    name: ELEMENT_NAME,
    _r: ">",
    value: ELEMENT_CONTENT,
    _l2: "</",
    _close: ELEMENT_NAME,
    _ok: ctx => ctx._close === ctx.name,
    _r2: ">",
};

export interface XmlTag {
    name: string;
    value: string;
}

export const GAV_GRAMMAR = Microgrammar.fromDefinitions<{ gav: VersionedArtifact }>({
    tags: atLeastOne(XML_TAG_WITH_SIMPLE_VALUE),
    _valid: ctx =>
        ctx.tags.filter(t => t.name === "groupId").length > 0 &&
        ctx.tags.filter(t => t.name === "artifactId").length > 0,
    gav: ctx => {
        const group = ctx.tags.filter(tag => tag.name === "groupId")[0].value;
        const artifact = ctx.tags.filter(tag => tag.name === "artifactId")[0].value;
        const versions = ctx.tags.filter(tag => tag.name === "version");
        const version = versions.length === 1 ? versions[0].value : undefined;
        return { group, artifact, version };
    },
});

export const PARENT_STANZA = Microgrammar.fromDefinitions<{ gav: VersionedArtifact }>({
    _start: "<parent>",
    _gav: GAV_GRAMMAR,
    gav: ctx => ctx._gav.gav,
});
