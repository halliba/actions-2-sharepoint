import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

interface IAuthOptions {
    tenantId: string
    clientId: string
    clientSecret: string
}

const createClient = (options: IAuthOptions): Client => {
    const tokenRequest = {
        scopes: ['https://graph.microsoft.com' + '/.default']
    };

    const app = new ConfidentialClientApplication({
        auth: {
            clientId: options.clientId,
            authority: `https://login.microsoftonline.com/${options.tenantId}`,
            clientSecret: options.clientSecret
        }
    });

    const client = Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                var result = await app.acquireTokenByClientCredential(tokenRequest);
                if (!result?.accessToken)
                    throw new Error('Could not retrieve access token.');
                return result.accessToken;
            }
        }
    });

    return client;
};

export type {
    IAuthOptions
};

export {
    createClient
};
