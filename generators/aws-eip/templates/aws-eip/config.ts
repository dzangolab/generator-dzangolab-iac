import { Config, getStack } from "@pulumi/pulumi";
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
    const stack = getStack();
    const stackConfig = new Config();

    return {
        name: stack,
        protect: stackConfig.getBoolean("protect"),
        retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    };
};

function getValue<T>(input: StackReferenceOutputDetails, defaultValue?: T): T {
    if (input && input.value) {
        return <T>input.value!;
    }

    if (input && input.secretValue) {
        return <T>input.secretValue!;
    }

    if (!defaultValue) {
        throw new Error("A value is required");
    }

    return defaultValue;
}