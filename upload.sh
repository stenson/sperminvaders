#!/usr/bin/env bash

echo "~~~~~Indices~~~~~"
aws s3 --region us-west-2 sync --cache-control no-cache --exclude "*" --include "*.html" . s3://sperminvaders.org --profile rob
echo "~~~~Cachables~~~~"
aws s3 --region us-west-2 sync . s3://sperminvaders.org --profile rob
aws s3 --region us-west-2 sync . s3://sperminvaders.org --profile rob