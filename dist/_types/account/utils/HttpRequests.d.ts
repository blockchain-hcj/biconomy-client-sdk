import type { Service } from "./Types.js";
export declare enum HttpMethod {
    Get = "get",
    Post = "post",
    Delete = "delete"
}
export interface HttpRequest {
    url: string;
    method: HttpMethod;
    body?: Record<string, any>;
}
export declare function sendRequest<T>({ url, method, body }: HttpRequest, service: Service): Promise<T>;
//# sourceMappingURL=HttpRequests.d.ts.map