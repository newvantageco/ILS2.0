/**
 * OpenAPI 3.1 Type Definitions
 *
 * Simplified type definitions for OpenAPI 3.1 specification.
 * Based on openapi-types package structure.
 */

declare module 'openapi-types' {
  export namespace OpenAPIV3_1 {
    interface Document {
      openapi: string;
      info: InfoObject;
      servers?: ServerObject[];
      paths?: PathsObject;
      components?: ComponentsObject;
      security?: SecurityRequirementObject[];
      tags?: TagObject[];
      externalDocs?: ExternalDocumentationObject;
    }

    interface InfoObject {
      title: string;
      version: string;
      description?: string;
      termsOfService?: string;
      contact?: ContactObject;
      license?: LicenseObject;
    }

    interface ContactObject {
      name?: string;
      url?: string;
      email?: string;
    }

    interface LicenseObject {
      name: string;
      url?: string;
    }

    interface ServerObject {
      url: string;
      description?: string;
      variables?: Record<string, ServerVariableObject>;
    }

    interface ServerVariableObject {
      enum?: string[];
      default: string;
      description?: string;
    }

    interface PathsObject {
      [path: string]: PathItemObject;
    }

    interface PathItemObject {
      $ref?: string;
      summary?: string;
      description?: string;
      get?: OperationObject;
      put?: OperationObject;
      post?: OperationObject;
      delete?: OperationObject;
      options?: OperationObject;
      head?: OperationObject;
      patch?: OperationObject;
      trace?: OperationObject;
      servers?: ServerObject[];
      parameters?: (ParameterObject | ReferenceObject)[];
    }

    interface OperationObject {
      tags?: string[];
      summary?: string;
      description?: string;
      externalDocs?: ExternalDocumentationObject;
      operationId?: string;
      parameters?: (ParameterObject | ReferenceObject)[];
      requestBody?: RequestBodyObject | ReferenceObject;
      responses?: ResponsesObject;
      callbacks?: Record<string, CallbackObject | ReferenceObject>;
      deprecated?: boolean;
      security?: SecurityRequirementObject[];
      servers?: ServerObject[];
    }

    interface ParameterObject {
      name: string;
      in: 'query' | 'header' | 'path' | 'cookie';
      description?: string;
      required?: boolean;
      deprecated?: boolean;
      allowEmptyValue?: boolean;
      schema?: SchemaObject | ReferenceObject;
      style?: string;
      explode?: boolean;
      allowReserved?: boolean;
      example?: any;
      examples?: Record<string, ExampleObject | ReferenceObject>;
    }

    interface RequestBodyObject {
      description?: string;
      content: Record<string, MediaTypeObject>;
      required?: boolean;
    }

    interface MediaTypeObject {
      schema?: SchemaObject | ReferenceObject;
      example?: any;
      examples?: Record<string, ExampleObject | ReferenceObject>;
      encoding?: Record<string, EncodingObject>;
    }

    interface EncodingObject {
      contentType?: string;
      headers?: Record<string, HeaderObject | ReferenceObject>;
      style?: string;
      explode?: boolean;
      allowReserved?: boolean;
    }

    interface ResponsesObject {
      [statusCode: string]: ResponseObject | ReferenceObject;
    }

    interface ResponseObject {
      description: string;
      headers?: Record<string, HeaderObject | ReferenceObject>;
      content?: Record<string, MediaTypeObject>;
      links?: Record<string, LinkObject | ReferenceObject>;
    }

    interface HeaderObject {
      description?: string;
      required?: boolean;
      deprecated?: boolean;
      schema?: SchemaObject | ReferenceObject;
    }

    interface LinkObject {
      operationRef?: string;
      operationId?: string;
      parameters?: Record<string, any>;
      requestBody?: any;
      description?: string;
      server?: ServerObject;
    }

    interface CallbackObject {
      [expression: string]: PathItemObject;
    }

    interface ComponentsObject {
      schemas?: Record<string, SchemaObject | ReferenceObject>;
      responses?: Record<string, ResponseObject | ReferenceObject>;
      parameters?: Record<string, ParameterObject | ReferenceObject>;
      examples?: Record<string, ExampleObject | ReferenceObject>;
      requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
      headers?: Record<string, HeaderObject | ReferenceObject>;
      securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
      links?: Record<string, LinkObject | ReferenceObject>;
      callbacks?: Record<string, CallbackObject | ReferenceObject>;
    }

    interface SchemaObject {
      type?: string | string[];
      format?: string;
      title?: string;
      description?: string;
      default?: any;
      enum?: any[];
      const?: any;
      multipleOf?: number;
      maximum?: number;
      exclusiveMaximum?: number;
      minimum?: number;
      exclusiveMinimum?: number;
      maxLength?: number;
      minLength?: number;
      pattern?: string;
      maxItems?: number;
      minItems?: number;
      uniqueItems?: boolean;
      maxProperties?: number;
      minProperties?: number;
      required?: string[];
      properties?: Record<string, SchemaObject | ReferenceObject>;
      additionalProperties?: boolean | SchemaObject | ReferenceObject;
      items?: SchemaObject | ReferenceObject;
      allOf?: (SchemaObject | ReferenceObject)[];
      oneOf?: (SchemaObject | ReferenceObject)[];
      anyOf?: (SchemaObject | ReferenceObject)[];
      not?: SchemaObject | ReferenceObject;
      nullable?: boolean;
      discriminator?: DiscriminatorObject;
      readOnly?: boolean;
      writeOnly?: boolean;
      xml?: XMLObject;
      externalDocs?: ExternalDocumentationObject;
      example?: any;
      deprecated?: boolean;
      $ref?: string;
    }

    interface ReferenceObject {
      $ref: string;
    }

    interface DiscriminatorObject {
      propertyName: string;
      mapping?: Record<string, string>;
    }

    interface XMLObject {
      name?: string;
      namespace?: string;
      prefix?: string;
      attribute?: boolean;
      wrapped?: boolean;
    }

    interface ExampleObject {
      summary?: string;
      description?: string;
      value?: any;
      externalValue?: string;
    }

    interface SecuritySchemeObject {
      type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
      description?: string;
      name?: string;
      in?: 'query' | 'header' | 'cookie';
      scheme?: string;
      bearerFormat?: string;
      flows?: OAuthFlowsObject;
      openIdConnectUrl?: string;
    }

    interface OAuthFlowsObject {
      implicit?: OAuthFlowObject;
      password?: OAuthFlowObject;
      clientCredentials?: OAuthFlowObject;
      authorizationCode?: OAuthFlowObject;
    }

    interface OAuthFlowObject {
      authorizationUrl?: string;
      tokenUrl?: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    }

    interface SecurityRequirementObject {
      [name: string]: string[];
    }

    interface TagObject {
      name: string;
      description?: string;
      externalDocs?: ExternalDocumentationObject;
    }

    interface ExternalDocumentationObject {
      description?: string;
      url: string;
    }
  }
}
