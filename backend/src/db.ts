import { SQL } from "bun"
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { hash } from "node:crypto";

const sm = new SecretsManagerClient({region: 'us-east-2'});
const { SecretString: secretString } = await sm.send(new GetSecretValueCommand({ SecretId: "rds!db-95994f48-2ed0-4e64-82a4-14a4505db99c"}))
const secret = JSON.parse(secretString ?? '{}') as { username: string; password: string };

const pg = new SQL({
    hostname: process.env.RDS_HOST,
    port: 5432,
    database: 'mvp_tracker',
    username: secret.username,
    password: secret.password,
    tls: true
})

export async function saveMvp(content: string) {
    const content_hash = hash('sha256', content);
    const [row] = await pg`insert into mvp (content, content_hash)
        values (${content}, ${content_hash})
        on conflict (content_hash) do update set last_seen_at = now()
        returning id;`

    return row.id
}