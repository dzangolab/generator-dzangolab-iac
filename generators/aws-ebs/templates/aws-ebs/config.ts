import {
  Config,
  getStack,
} from "@pulumi/pulumi";
  
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const stack = getStack();
  const stackConfig = new Config();

  const availabilityZones = stackConfig.requireObject<string[]>("availabilityZones");
  
  const count = availabilityZones.length;
  
  let sizes = stackConfig.getObject<number | number[]>("sizes") || 5;

  if (!Array.isArray(sizes)) {
    const size = Number(sizes);
    
    sizes = [] as number[];

    for (let i = 0; i < count; i++) {
      sizes.push(size);
    }
  }
  
  return {
      availabilityZones: stackConfig.getObject<string[]>("availabilityZones"),
      name: stack,
      protect: stackConfig.getBoolean("protect"),
      retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
      sizes,
      suffix: stackConfig.require("suffix"),
      tags: stackConfig.getObject<{ [key: string]: string }>("tags")
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