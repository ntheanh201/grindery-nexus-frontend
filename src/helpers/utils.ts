import axios from "axios";
import _ from "lodash";
import {
  ActionOperation,
  Connector,
  Field,
  TriggerOperation,
} from "../types/Connector";

export const getParameterByName = (
  name: string,
  url = window.location.href
) => {
  // eslint-disable-next-line no-useless-escape
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

const TOKEN_TRANSFORMERS = {
  //@ts-ignore
  urlencode: (s) => encodeURIComponent(String(s)),
  //@ts-ignore
  urldecode: (s) => decodeURIComponent(String(s)),
  //@ts-ignore
  json: (s) => JSON.stringify(s),
  //@ts-ignore
  "": (s) => String(s),
};

export function replaceTokens<T>(obj: T, context: { [key: string]: unknown }): T {
  if (typeof obj === "string") {
    return obj.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_original, key) => {
      const parts = key.split("|");
      //@ts-ignore
      const transform = TOKEN_TRANSFORMERS[parts[1] ? parts[1].trim() : ""] || TOKEN_TRANSFORMERS[""];
      const ret = transform((_.get(context, parts[0].trim(), "") as string) ?? "");
      return ret;
    }) as unknown as T;
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item) => replaceTokens(item, context)) as unknown as T;
    }
    //@ts-ignore
    return Object.entries(obj).reduce((acc, [key, value]) => {
      //@ts-ignore
      acc[key] = replaceTokens(value, context);
      return acc;
    }, {} as T);
  }
  return obj;
}

export const getOutputOptions = (
  operation: TriggerOperation | ActionOperation,
  connector: Connector
) => {
  if (!operation) {
    return [];
  } else {
    return _.flatten(
      operation.outputFields &&
        operation.outputFields.map((outputField: any) => {
          if (outputField.list) {
            const sampleInput = operation.sample?.[outputField.key];
            return Array.isArray(sampleInput)
              ? sampleInput.map((sample: any, i: any) => ({
                  value: `{{trigger.${outputField.key}[${i}]}}`,
                  label: `${outputField.label || outputField.key}[${i}]`,
                  reference: sample,
                  icon: connector.icon || "",
                  group: connector.name,
                }))
              : [];
          } else {
            return {
              value: `{{trigger.${outputField.key}}}`,
              label: outputField.label || outputField.key,
              reference: operation.sample?.[outputField.key],
              icon: connector.icon || "",
              group: connector.name,
            };
          }
        })
    );
  }
};

export const jsonrpcObj = (method: string, params: object) => {
  return {
    jsonrpc: "2.0",
    method: method,
    id: new Date(),
    params,
  };
};

export const defaultFunc = () => {};


export const getValidationScheme = (inputFields: Field[]) => {
  const sanitizeType = (type: string) => {
    switch (type) {
      case "integer":
        return "number";
      case "text":
        return "string";
      case "datetime":
        return "date";
      case "file":
        return "string";
      case "password":
        return "string";
      case "copy":
        return "string";
      case "code":
        return "string";
      case "info":
        return "string";
      default:
        return type;
    }
  };
  const schema: any = {};
  inputFields.forEach((field: Field) => {
    schema[field.key] = {
      type: sanitizeType(field.type || ""),
      ...field.validation,
      optional: !field.required,
      empty: !field.required,
    };
    if (field.list) {
      schema[field.key].items = {
        type: sanitizeType(field.type || ""),
        empty: !field.required,
      };
      schema[field.key].type = "array";
    }
  });

  return schema;
};

