#!/bin/bash

nr_files=11

#for i in {1..5}
for (( i = 0; i < $nr_files; i++ )) 
do
   file=upload/split_data_$i.json
   echo "upload $file"
   wrangler kv:bulk put --binding=collection $file 
done