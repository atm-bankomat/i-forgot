
export interface IdentifiedArtifact {

    group: string;

    artifact: string;
}

export interface VersionedArtifact extends IdentifiedArtifact {

    version: string;
}
