

# Setup for Backend

Amazon Cloud Services used: EC2, RDS

RDS is only reached from EC2 via the security group that is set to access our database `mvp-tracker-db-sg`

1. RDS is only limited to its VPS that it is made in, private subnets that were made in the DB subnet group use a route table with no route to an internet gateway, meaning no traffic outside can come in or out.

2. The security group is an essential firewall which limits the port to 5432 for Postgres but limits the source to another security group we made for the EC2 `mvp-tracker-api-sg`. Which means anything even in the DB's own VPC is refused

3. Another layer will be added for password which will live in Secrets Manager, so that the EC2 can't connect without it.

## Migrations

Run from EC2 via Data Grip, `001_init.sql` then `002_extracted.sql`
