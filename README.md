# employer-api-examples  
  
Examples for setting up an API with data from Employer dataset.  

  
## Serverless cloudflare worker
  
### Prepare  
  
1. Create a new KV namespace in your cloudflare worker account named DATA1. This will also generate a namespace id. 
2. Change the account id and the binding id in wrangler.toml.
```
account_id = "..."
...
{ binding = "DATA1", id = "..." }
```
3. Install wrangler and login.
```shell  
user:~$ npm i @cloudflare/wrangler -g
user:~$ wrangler login
```  
### Upload data

4. Make sure the the following files from Employer dataset are put in the `input/` directory: `table_employers.parquet`, `collections.parquet`.
5. To generate files with key-value pairs from the dataset files, run `python conversion_kv.py`. The files will be saved in `upload/` and each file will contain max 10,000 key-value pairs. 
6. To upload the key-value pairs to your KV namespace, run 
```shell 
user:~$ bash upload_cf.sh
```

### Start worker
7. Run `wrangler publish` to start  `worker.js`.
