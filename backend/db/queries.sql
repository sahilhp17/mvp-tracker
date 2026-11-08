/* example inserts */
insert into mvp (content, content_hash)
values ('# test MVP', 'abc123')
on conflict (content_hash) do update set last_seen_at = now()
returning id;

insert into comparisons (status, mvp_id)
values ('running', 1)
returning id;

/* start */
begin;
update comparisons
set status = 'failed', failure = 'Ran too long', finished_at = now()
where (status = 'running' and started_at < now() - interval '10 minutes');
insert into comparisons (status, mvp_id)
values ('running', 1)
returning id;
rollback;
commit;

/* finish w/ success */
update comparisons set status = 'succeeded', result = '{
  "text": "This is some text from the LLM"
}', finished_at = now()
where id = '2' and status = 'running'
returning id;

/* finish w/ failure */
begin;
update comparisons set status = 'failed', failure = 'Backend error', finished_at = now()
where id = '2' and status = 'running'
returning id;
end;

/* the newest MVP */
select * from mvp
order by last_seen_at desc
limit 1;

/* latest succeeded comparison, can change `limit` to a different number for more entries */
select * from comparisons
where status = 'succeeded'
order by finished_at desc
limit 1;

/* latest comparison status, same thing with `limit` as above */
select status, failure, started_at, mvp_id from comparisons
order by started_at desc
limit 1;
