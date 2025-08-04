import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        /**
         * Since we're in the app directory, we need to configure this
         * @see https://docs.uploadthing.com/api-reference/server#config
         */
    },
});