import {createAppAuth} from '@octokit/auth-app'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { json } from 'zod';

const sm = new SecretsManagerClient({region: 'us-east-2'});
const { SecretString: privateKey } = await sm.send(new GetSecretValueCommand({ SecretId: "mvp-tracker/github-app-key"}))
const auth = createAppAuth({
    appId: process.env.GITHUB_APP_CLIENT_ID!,
    privateKey: privateKey!,
})
 
export async function getMVP(): Promise<string | null> {
    const { token } = await auth({ type: "installation", 
        installationId: process.env.INSTALLATION_ID!,})
    const response = await fetch(
        "https://api.github.com/repos/sahilhp17/mvp-tracker/contents/MVP.md",
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.object",
                "X-GitHub-Api-Version": "2022-11-28",
            }
        }
    );
    if (response.status == 404) return null; // no MVP.md
    if (!response.ok) throw new Error(`Github returned ${response.status}`)
    const json = await response.json();
    return Buffer.from(json.content, "base64").toString("utf8");
}