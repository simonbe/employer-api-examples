#!/bin/bash

nr_files=1

#for i in {1..5}
for (( i = 0; i <= $nr_files; i++ )) 
do
   file=../upload/data_to_upload_$i.json
   echo "upload $file"
   wrangler kv:bulk put --binding=TODO $file 
done